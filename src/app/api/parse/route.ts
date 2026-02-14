import { NextResponse } from "next/server";
import type { ParseResponse } from "@/lib/types";
import { parseYoutubeUrl } from "@/lib/youtube";
import { getPlaylistTracks, getVideoInfo } from "@/lib/piped";

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

    if (parsed.type === "playlist" && parsed.playlistId) {
      const playlist = await getPlaylistTracks(parsed.playlistId);

      const response: ParseResponse = {
        type: "playlist",
        tracks: playlist.tracks,
        playlistTitle: playlist.title,
      };

      return NextResponse.json(response);
    }

    if (parsed.videoId) {
      const track = await getVideoInfo(parsed.videoId);
      const response: ParseResponse = { type: "video", tracks: [track] };
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: "Could not parse URL" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
