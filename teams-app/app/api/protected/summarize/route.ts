import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import redis from "@/lib/redis";
import { rateLimit } from "@/lib/security/rateLimit";
import { hashToken } from "@/lib/auth/session";
import dbConnect from "@/lib/db";
import Summary from "@/models/Summary";
import { getAuthContext } from "@/lib/auth/context";
import { User } from "@/models/User";

import * as cheerio from "cheerio";
import { chromium } from "playwright";

// ⬅️ VERY IMPORTANT
export const runtime = "nodejs";

// =======================
// OpenAI Init
// =======================
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// =======================
// Helpers
// =======================
function isPrivateHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.")
  );
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error("Failed to fetch HTML");
  return await res.text();
}

// =======================
// Cheerio Extraction
// =======================
function extractWithCheerio(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, nav, footer, header, ads").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text() ||
    "Web Article";

  const content = $("body").text().replace(/\s+/g, " ").trim();

  if (!content || content.length < 300) {
    throw new Error("Insufficient readable content");
  }

  return { title, content };
}

// =======================
// Playwright Fallback
// =======================
async function extractWithPlaywright(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const html = await page.content();

  await browser.close();

  return extractWithCheerio(html);
}

// =======================
// API Route
// =======================
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const { userId } = getAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(userId);

    if (!user || user.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 403 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await rateLimit({
      key: `rl:summarize:${ip}`,
      limit: 5,
      windowInSeconds: 300,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // =======================
    // YOUTUBE DETECTION
    // =======================
    const isYoutube =
      url.includes("youtube.com") || url.includes("youtu.be");

    let videoId: string | null = null;

    if (isYoutube) {
      const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      videoId = match ? match[1] : null;

      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL" },
          { status: 400 }
        );
      }

      // -----------------------
      // MongoDB Cache ONLY
      // -----------------------
      const existing = await Summary.findOne({ url });

      if (existing) {
        await User.findByIdAndUpdate(userId, {
          $inc: { credits: -1, totalSummaries: 1 },
        });

        await Summary.create({
          userId,
          url,
          title: existing.title,
          summary: existing.summary,
          type: "video",
          videoDuration: existing.videoDuration,
        });

        return NextResponse.json({
          summary: existing.summary,
          source: "mongodb",
        });
      }
    }

    // =======================
    // WEBSITE CACHE (REDIS)
    // =======================
    const cacheKey = `summary:v2:${hashToken(url)}`;
    const cached = !isYoutube ? await redis.get(cacheKey) : null;

    if (cached) {
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: -1, totalSummaries: 1 },
      });

      await Summary.create({
        userId,
        url,
        title: "Cached Web Article",
        summary: cached,
        type: "website",
      });

      return NextResponse.json({ summary: cached, source: "cache" });
    }

    // =======================
    // CONTENT EXTRACTION
    // =======================
    let title = "Web Article";
    let content = "";

    if (isYoutube && videoId) {
      const transcriptRes = await fetch(
        "https://www.youtube-transcript.io/api/transcripts",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${process.env.YOUTUBE_TRANSCRIPT_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: [videoId] }),
        }
      );

      if (!transcriptRes.ok) {
        return NextResponse.json(
          { error: "Transcript not available" },
          { status: 400 }
        );
      }

      const data = await transcriptRes.json();

      if (!Array.isArray(data) || !data[0]?.text) {
        return NextResponse.json(
          { error: "Transcript not found" },
          { status: 400 }
        );
      }

      title = data[0].title || "YouTube Video";
      content = data[0].text;
    } else {
      try {
        const html = await fetchHtml(url);
        const extracted = extractWithCheerio(html);
        title = extracted.title;
        content = extracted.content;
      } catch {
        const fallback = await extractWithPlaywright(url);
        title = fallback.title;
        content = fallback.content;
      }
    }

    const input = content.slice(0, 12000);

    // =======================
    // OPENAI STREAMING
    // =======================
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: "Summarize the following content clearly in Markdown.",
        },
        { role: "user", content: input },
      ],
    });

    let charged = false;
    let finalSummary = "";
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (!text) continue;

            if (!charged) {
              await User.findByIdAndUpdate(userId, {
                $inc: { credits: -1, totalSummaries: 1 },
              });
              charged = true;
            }

            finalSummary += text;
            controller.enqueue(encoder.encode(text));
          }

          await Summary.create({
            userId,
            url,
            title,
            summary: finalSummary,
            type: isYoutube ? "video" : "website",
          });

          if (!isYoutube) {
            await redis.set(cacheKey, finalSummary, "EX", 300);
          }
        } catch (err) {
          console.error("Streaming error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
