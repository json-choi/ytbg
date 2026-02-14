import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new Map<string, { url: string; expiresAt: number }>();

const CACHE_TTL = 5 * 60 * 1000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;

    if (!ytdl.validateID(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const cached = cache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        url: cached.url,
        expiresAt: cached.expiresAt,
      });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);

    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    const expiresAt = Date.now() + CACHE_TTL;
    cache.set(videoId, { url: format.url, expiresAt });

    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (val.expiresAt < now) cache.delete(key);
      }
    }

    return NextResponse.json({ url: format.url, expiresAt });
  } catch (error) {
    console.error("Stream error:", error);

    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limited. Try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Failed to get audio stream" },
      { status: 500 },
    );
  }
}
