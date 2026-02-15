import { NextResponse } from "next/server";
import type { ParseResponse, Track } from "@/lib/types";
import { parseYoutubeUrl, getThumbnailUrl } from "@/lib/youtube";

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

    if (parsed.type === "playlist" && !parsed.videoId) {
      // Cobalt doesn't have a playlist metadata endpoint.
      // We use oembed to get the playlist title, and return tracks
      // with just videoId-based info — actual metadata comes at download time.
      const playlistId = parsed.playlistId!;

      // Try to get playlist info via YouTube's oembed (public, no auth)
      let playlistTitle = "Playlist";
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`;
        const oembedRes = await fetch(oembedUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          playlistTitle = oembed.title || playlistTitle;
        }
      } catch {}

      // YouTube doesn't expose playlist items via public API without API key.
      // Return the playlist URL as a single track — user can add individual videos.
      return NextResponse.json({
        error: "플레이리스트는 개별 영상 URL로 추가해주세요. 플레이리스트 전체 가져오기는 준비 중입니다.",
      }, { status: 400 });
    }

    // Single video
    const videoId = parsed.videoId;
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse URL" },
        { status: 400 },
      );
    }

    // Get video info via YouTube oembed (public, no auth, no API key)
    let title = "Unknown";
    let channel = "Unknown";
    const thumbnail = getThumbnailUrl(videoId);

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || title;
        channel = oembed.author_name || channel;
      }
    } catch {}

    const track: Track = {
      id: videoId,
      title,
      thumbnail,
      duration: 0,
      channel,
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
