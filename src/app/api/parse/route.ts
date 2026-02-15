import { NextResponse } from "next/server";
import type { ParseResponse, Track } from "@/lib/types";
import { parseYoutubeUrl, getThumbnailUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchPlaylistTracks(playlistId: string): Promise<{ title: string; tracks: Track[] }> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error("Failed to fetch playlist page");

  const html = await res.text();

  // 플레이리스트 제목 추출
  let playlistTitle = "Playlist";
  const titleMatch = html.match(/"title":"([^"]+)".*?"playlistId"/);
  if (titleMatch) playlistTitle = titleMatch[1];

  // ytInitialData에서 영상 목록 추출
  const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});\s*<\/script>/);
  if (!dataMatch) {
    // 폴백: videoId만 추출
    const fallbackIds = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)]
      .map(m => m[1])
      .filter((v, i, a) => a.indexOf(v) === i);

    if (fallbackIds.length === 0) throw new Error("Could not parse playlist data");

    const tracks: Track[] = fallbackIds.map(id => ({
      id,
      title: "Unknown",
      thumbnail: getThumbnailUrl(id),
      duration: 0,
      channel: "Unknown",
      downloaded: false,
    }));

    return { title: playlistTitle, tracks };
  }

  const jsonStr = dataMatch[1];
  const tracks: Track[] = [];
  const seen = new Set<string>();

  // playlistVideoRenderer에서 videoId + title 추출
  const rendererPattern = /"playlistVideoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]*?)"\}/g;
  let match;
  while ((match = rendererPattern.exec(jsonStr)) !== null) {
    const [, videoId, title] = match;
    if (!seen.has(videoId)) {
      seen.add(videoId);
      tracks.push({
        id: videoId,
        title: title || "Unknown",
        thumbnail: getThumbnailUrl(videoId),
        duration: 0,
        channel: "Unknown",
        downloaded: false,
      });
    }
  }

  // renderer 파싱 실패 시 videoId만이라도 추출
  if (tracks.length === 0) {
    const idPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let idMatch;
    while ((idMatch = idPattern.exec(jsonStr)) !== null) {
      if (!seen.has(idMatch[1])) {
        seen.add(idMatch[1]);
        tracks.push({
          id: idMatch[1],
          title: "Unknown",
          thumbnail: getThumbnailUrl(idMatch[1]),
          duration: 0,
          channel: "Unknown",
          downloaded: false,
        });
      }
    }
  }

  return { title: playlistTitle, tracks };
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
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 },
      );
    }

    // 플레이리스트 처리
    if (parsed.type === "playlist" && !parsed.videoId) {
      const { title, tracks } = await fetchPlaylistTracks(parsed.playlistId!);

      if (tracks.length === 0) {
        return NextResponse.json({ error: "플레이리스트에서 영상을 찾을 수 없습니다." }, { status: 400 });
      }

      const response: ParseResponse = {
        type: "playlist",
        tracks,
        playlistTitle: title,
      };
      return NextResponse.json(response);
    }

    // 단일 영상
    const videoId = parsed.videoId;
    if (!videoId) {
      return NextResponse.json({ error: "Could not parse URL" }, { status: 400 });
    }

    let title = "Unknown";
    let channel = "Unknown";
    const thumbnail = getThumbnailUrl(videoId);

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || title;
        channel = oembed.author_name || channel;
      }
    } catch {}

    const track: Track = { id: videoId, title, thumbnail, duration: 0, channel };
    const response: ParseResponse = { type: "video", tracks: [track] };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Parse error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
