import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import redis from "@/lib/redis";
import * as cheerio from "cheerio";
import { hashToken } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY, // Make sure this matches your .env variable name
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
    const url = body?.url;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ============================================================
    // STEP 1: RATE LIMITER
    // ============================================================
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const key = `rl:summarize:${ip}`;
    
    const { allowed } = await rateLimit({
      key,
      limit: 5,
      windowInSeconds: 300, // 5 requests per 5 minutes
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // ============================================================
    // STEP 2: CACHE CHECK
    // ============================================================
    const urlHash = hashToken(url); // Ensure this returns a string
    const cachedKey = `summary:${urlHash}`;

    const cachedSummary = await redis.get(cachedKey);
    if (cachedSummary) {
      return NextResponse.json({
        summary: cachedSummary,
        source: "cache",
      });
    }

    // ============================================================
    // STEP 3: FETCH CONTENT (YouTube API or Cheerio)
    // ============================================================
    let content = "";

    try {
      content = await fetchWithRetry(async () => {
        // A. Handle YouTube URLs using youtube-transcript.io
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          
          // 1. Extract Video ID
          const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
          const videoId = videoIdMatch ? videoIdMatch[1] : null;

          if (!videoId) throw new Error("Invalid YouTube URL");

          // 2. Call the Third-Party API
          const transcriptRes = await fetch("https://www.youtube-transcript.io/api/transcripts", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${process.env.YOUTUBE_TRANSCRIPT_API_TOKEN}`, // Add this to your .env
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ids: [videoId], // Pass the dynamic ID here
            }),
          });

          if (!transcriptRes.ok) {
            throw new Error(`Transcript API failed with status ${transcriptRes.status}`);
          }

          const data = await transcriptRes.json();

          // 3. Extract the text from the response array
          // The API returns: [{ text: "...", id: "...", ... }]
          if (Array.isArray(data) && data.length > 0 && data[0].text) {
             return data[0].text;
          } else {
             throw new Error("No transcript found in API response");
          }
        } 
        
        // B. Handle Standard Webpages
        else {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          $("script, style, nav, footer, iframe").remove();
          return $("body").text().replace(/\s+/g, " ").trim();
        }
      });
    } catch (err: any) {
      console.error("Scraping failed:", err);
      return NextResponse.json(
        { error: "Failed to extract content. The video might not have captions or the source is blocking us." },
        { status: 400 }
      );
    }

    // ============================================================
    // STEP 4: SUMMARIZE (OpenAI Streaming)
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

    const encoder = new TextEncoder();
    let fullGeneratedSummary = "";

    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullGeneratedSummary += content;
            controller.enqueue(encoder.encode(content));
          }
        }

        // Stream finished: Save to Redis (TTL: 24 hours)
        if (fullGeneratedSummary.length > 0) {
          await redis.set(cachedKey, fullGeneratedSummary, "EX", 86400);
          console.log("Saved new summary to Redis cache");
        }

        controller.close();
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