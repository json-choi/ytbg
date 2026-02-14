import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import type { Track, ParseResponse } from "@/lib/types";
import { parseYoutubeUrl, getThumbnailUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDurationString(dur: string | null): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url as string;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const parsed = parseYoutubeUrl(url);

    if (parsed.type === "invalid") {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    if (parsed.type === "playlist" && parsed.playlistId) {
      const playlist = await ytpl(parsed.playlistId, { limit: 200 });

      const tracks: Track[] = playlist.items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail || getThumbnailUrl(item.id),
        duration: item.duration ? parseDurationString(item.duration) : 0,
        channel: item.author?.name ?? "Unknown",
      }));

      const response: ParseResponse = {
        type: "playlist",
        tracks,
        playlistTitle: playlist.title,
      };

      return NextResponse.json(response);
    }

    if (parsed.videoId) {
      const videoUrl = `https://www.youtube.com/watch?v=${parsed.videoId}`;
      const info = await ytdl.getBasicInfo(videoUrl);
      const { videoDetails } = info;

      const track: Track = {
        id: videoDetails.videoId,
        title: videoDetails.title,
        thumbnail:
          videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url ||
          getThumbnailUrl(videoDetails.videoId),
        duration: parseInt(videoDetails.lengthSeconds, 10),
        channel: videoDetails.author?.name ?? "Unknown",
      };

      const response: ParseResponse = { type: "video", tracks: [track] };
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Could not parse URL" }, { status: 400 });
  } catch (error) {
    console.error("Parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
