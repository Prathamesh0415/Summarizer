import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import redis from "@/lib/redis";
import { rateLimit } from "@/lib/security/rateLimit";
import { hashToken } from "@/lib/auth/session";
import dbConnect from "@/lib/db";
import Summary from "@/models/Summary";
import { getAuthContext } from "@/lib/auth/context";
import { User } from "@/models/User";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { chromium } from "playwright";

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

function extractWithReadability(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.length < 300) {
    throw new Error("Insufficient readable content");
  }

  return {
    title: article.title || "Web Article",
    content: article.textContent,
  };
}

async function extractWithPlaywright(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const html = await page.content();

  await browser.close();

  return extractWithReadability(html, url);
}

// =======================
// API Route
// =======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // =======================
    // SSRF Protection
    // =======================
    const parsedUrl = new URL(url);
    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // =======================
    // Auth & User
    // =======================
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

    // =======================
    // Rate Limit
    // =======================
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
    // Cache Check (Web only)
    // =======================
    const cacheKey = `summary:v2:${hashToken(url)}`;
    const cached = await redis.get(cacheKey);

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
    // Content Extraction
    // =======================
    let title = "Web Article";
    let content = "";

    try {
      const html = await fetchHtml(url);
      const extracted = extractWithReadability(html, url);
      title = extracted.title;
      content = extracted.content;
    } catch {
      const fallback = await extractWithPlaywright(url);
      title = fallback.title;
      content = fallback.content;
    }

    // =======================
    // Truncate (safe)
    // =======================
    const input = content.slice(0, 12000);

    // =======================
    // OpenAI Streaming
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
            if (text) {
              if (!charged) {
                await User.findByIdAndUpdate(userId, {
                  $inc: { credits: -1, totalSummaries: 1 },
                });
                charged = true;
              }

              finalSummary += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          await Summary.create({
            userId,
            url,
            title,
            summary: finalSummary,
            type: "website",
          });

          await redis.set(cacheKey, finalSummary, "EX", 300);
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
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
