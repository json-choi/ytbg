import { NextResponse } from "next/server";
import type { ParseResponse, Track } from "@/lib/types";
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

    // Handle playlist URLs
    if (parsed.type === "playlist" && !parsed.videoId) {
      const playlistUrl = `https://www.youtube.com/playlist?list=${parsed.playlistId}`;
      const res = await fetch(`${SERVER_URL}/api/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: playlistUrl }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "Failed to get playlist info");
        throw new Error(err);
      }

      const playlistInfo = await res.json();
      const tracks: Track[] = (playlistInfo.tracks || []).map(
        (t: { id: string; title: string; duration: number; thumbnail: string }) => ({
          id: t.id,
          title: t.title || "Unknown",
          thumbnail: (t.thumbnail && t.thumbnail !== "NA" && t.thumbnail.startsWith("http")) ? t.thumbnail : getThumbnailUrl(t.id),
          duration: t.duration || 0,
          channel: "Unknown",
          downloaded: false,
        }),
      );

      const response: ParseResponse = {
        type: "playlist",
        tracks,
        playlistTitle: playlistInfo.title,
      };
      return NextResponse.json(response);
    }

    // Handle single video (including playlist URL with a specific video)
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
