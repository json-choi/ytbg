import { NextResponse } from "next/server";
import { getAudioStream } from "@/lib/piped";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new Map<
  string,
  { url: string; duration: number; mimeType: string; expiresAt: number }
>();

const CACHE_TTL = 5 * 60 * 1000;

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;

    if (!VIDEO_ID_REGEX.test(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const cached = cache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        url: cached.url,
        expiresAt: cached.expiresAt,
      });
    }

    const stream = await getAudioStream(videoId);
    const expiresAt = Date.now() + CACHE_TTL;

    cache.set(videoId, { ...stream, expiresAt });

    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (val.expiresAt < now) cache.delete(key);
      }
    }

    return NextResponse.json({ url: stream.url, expiresAt });
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
