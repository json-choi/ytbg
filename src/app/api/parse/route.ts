import { NextResponse } from "next/server";
import type { ParseResponse } from "@/lib/types";
import { parseYoutubeUrl, getThumbnailUrl } from "@/lib/youtube";

const SERVER_URL =
  process.env.NEXT_PUBLIC_YTBG_SERVER_URL ||
  "https://hearty-connection-production-01b9.up.railway.app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url as string;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const parsed = parseYoutubeUrl(url);

    if (parsed.type === "invalid") {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 },
      );
    }

    // For playlists, we no longer support fetching all tracks at once.
    // If there's a video ID in the playlist URL, treat it as a single video.
    // Otherwise, return an error suggesting individual URLs.
    if (parsed.type === "playlist" && !parsed.videoId) {
      return NextResponse.json(
        { error: "플레이리스트는 지원하지 않습니다. 개별 영상 URL을 사용해주세요." },
        { status: 400 },
      );
    }

    const videoId = parsed.videoId;
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse URL" },
        { status: 400 },
      );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const res = await fetch(`${SERVER_URL}/api/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: youtubeUrl }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Failed to get info");
      throw new Error(err);
    }

    const info = await res.json();

    const track = {
      id: videoId,
      title: info.title || "Unknown",
      thumbnail: info.thumbnail || getThumbnailUrl(videoId),
      duration: info.duration || 0,
      channel: info.channel || "Unknown",
    };

    const response: ParseResponse = { type: "video", tracks: [track] };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
