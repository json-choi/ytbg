import { NextResponse } from "next/server";
import type { ParseResponse, Track } from "@/lib/types";
import { parseYoutubeUrl, getThumbnailUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchPlaylistTracks(playlistId: string): Promise<{ title: string; tracks: Track[] }> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
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
  const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!dataMatch) throw new Error("Could not parse playlist data");

  const data = JSON.parse(dataMatch[1]);

  const tracks: Track[] = [];
  const seen = new Set<string>();

  // 재귀적으로 videoId + title 추출
  const jsonStr = JSON.stringify(data);
  const videoPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const videoIds: string[] = [];
  let match;
  while ((match = videoPattern.exec(jsonStr)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      videoIds.push(match[1]);
    }
  }

  // 각 videoId에 대한 제목도 추출 시도
  for (const videoId of videoIds) {
    const titlePattern = new RegExp(
      `"videoId":"${videoId}"[^}]*?"title":\\{"runs":\\[\\{"text":"([^"]+)"`,
    );
    const titleMatch2 = jsonStr.match(titlePattern);
    const title = titleMatch2?.[1] || "Unknown";

    tracks.push({
      id: videoId,
      title,
      thumbnail: getThumbnailUrl(videoId),
      duration: 0,
      channel: "Unknown",
      downloaded: false,
    });
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
