import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import redis from "@/lib/redis";
import * as cheerio from "cheerio";
import { hashToken } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";
import dbConnect from "@/lib/db"; 
import Summary from "@/models/Summary"; 
import { getAuthContext } from "@/lib/auth/context";
import { User } from "@/models/User";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Helper: Exponential Backoff for retries
async function fetchWithRetry(fn: () => Promise<string>, retries = 3, delay = 1000): Promise<string> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { url } = body || {}; 
    const { userId } = getAuthContext(req);

    await dbConnect(); // Ensure DB connection early
    const user = await User.findOne({_id: userId});

    if(!user){
      return NextResponse.json({error: "Bad request"}, {status: 400})
    }

    // 1. CREDIT CHECK: Block if user has 0 or less credits
    if(user.credits <= 0){
      return NextResponse.json({
        error: "Insufficient credits. Please upgrade your plan."
      }, { status: 403 })
    }

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    
    if (!userId) {
       return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // --- HELPER: Atomic Credit Deduction ---
    const deductCredit = async (uid: string) => {
      // $inc is atomic: prevents race conditions if user spams clicks
      await User.findByIdAndUpdate(uid, { $inc: { credits: -1, totalSummaries: 1 } });
      console.log(`💰 Credit deducted for User ${uid}`);
    };

    // ============================================================
    // STEP 1: RATE LIMITER
    // ============================================================
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const key = `rl:summarize:${ip}`;
    
    const { allowed } = await rateLimit({
      key,
      limit: 5,
      windowInSeconds: 300, 
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // ============================================================
    // STEP 2: CACHE & DB CHECK (The Split Strategy)
    // ============================================================
    
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    let videoId = null;

    if (isYoutube) {
      const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      videoId = match ? match[1] : null;
    }

    // --- BRANCH A: YOUTUBE (Check MongoDB ONLY) ---
    if (isYoutube) {
      const existingSummary = await Summary.findOne({ url: url });

      if (existingSummary) {
        console.log("Creating new history entry from existing DB record (Youtube)...");
        
        // 💰 PAYMENT: Deduct for Cache Hit
        await deductCredit(userId);
        
        // Create a fresh entry for THIS user in their history
        await Summary.create({
          userId,
          url,
          title: existingSummary.title,
          summary: existingSummary.summary,
          type: "video",
          videoDuration: existingSummary.videoDuration
        });

        return NextResponse.json({
          summary: existingSummary.summary,
          source: "mongodb", 
        });
      }
    } 
    
    // --- BRANCH B: WEBSITE (Check Redis ONLY) ---
    else {
      const urlHash = hashToken(url);
      const cachedKey = `summary:${urlHash}`;
      const cachedSummary = await redis.get(cachedKey);

      if (cachedSummary) {
        console.log("Hit Redis Cache for Website");
        
        // 💰 PAYMENT: Deduct for Cache Hit
        await deductCredit(userId);
        
        await dbConnect();
        await Summary.create({
            userId,
            url,
            title: "Web Article (Cached)",
            summary: cachedSummary,
            type: "website"
        });

        return NextResponse.json({
          summary: cachedSummary,
          source: "cache",
        });
      }
    }

    // ============================================================
    // STEP 3: FETCH CONTENT (Scraping)
    // ============================================================
    let content = "";
    let pageTitle = "New Summary"; 

    try {
      content = await fetchWithRetry(async () => {
        if (isYoutube) {
          if (!videoId) throw new Error("Invalid YouTube URL");

          const transcriptRes = await fetch("https://www.youtube-transcript.io/api/transcripts", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${process.env.YOUTUBE_TRANSCRIPT_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids: [videoId] }),
          });

          if (!transcriptRes.ok) throw new Error(`Transcript API failed: ${transcriptRes.status}`);
          const data = await transcriptRes.json();

          if (Array.isArray(data) && data.length > 0 && data[0].text) {
             pageTitle = data[0].title || "YouTube Video"; 
             return data[0].text;
          } else {
             throw new Error("No transcript found");
          }
        } else {
          // Web Scraping
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const extractedTitle = $("title").text().trim();
          if (extractedTitle) pageTitle = extractedTitle;

          $("script, style, nav, footer, iframe").remove();
          return $("body").text().replace(/\s+/g, " ").trim();
        }
      });
    } catch (err: any) {
      console.error("Scraping failed:", err);
      return NextResponse.json(
        { error: "Failed to extract content. Video might lack captions." },
        { status: 400 }
      );
    }

    // ============================================================
    // STEP 4: SUMMARIZE (Streaming) & FINAL SAVE
    // ============================================================
    const truncatedContent = content.slice(0, 15000);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Summarize the following content in Markdown.",
        },
        {
          role: "user",
          content: truncatedContent,
        },
      ],
      stream: true,
    });

    // 💰 PAYMENT: Deduct for Fresh Generation
    // We deduct here to ensure the user is charged as soon as OpenAI starts working
    await deductCredit(userId);

    const encoder = new TextEncoder();
    let fullGeneratedSummary = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullGeneratedSummary += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // --- FINAL STORAGE LOGIC (Post-Generation) ---
          if (fullGeneratedSummary.length > 0) {
            await dbConnect();

            // 1. ALWAYS Save to MongoDB (Both YT and Web)
            await Summary.create({
              userId,
              url,
              title: pageTitle,
              summary: fullGeneratedSummary,
              type: isYoutube ? "video" : "website",
            });
            console.log("✅ Saved summary to MongoDB");

            // 2. CONDITIONALLY Save to Redis
            if (isYoutube) {
               console.log("🚫 Skipping Redis cache for YouTube video");
            } else {
               const urlHash = hashToken(url);
               const cachedKey = `summary:${urlHash}`;
               await redis.set(cachedKey, fullGeneratedSummary, "EX", 300); // 300s = 5 mins
               console.log("✅ Saved Web summary to Redis (5 mins TTL)");
            }
          }
        } catch (e) {
          console.error("Stream processing error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}