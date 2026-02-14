import type { Track } from "./types";
import { getThumbnailUrl } from "./youtube";

let PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
];

let instancesLastFetched = 0;
const INSTANCES_TTL = 30 * 60 * 1000;

async function refreshInstances(): Promise<void> {
  if (Date.now() - instancesLastFetched < INSTANCES_TTL) return;
  try {
    const res = await fetch("https://piped-instances.kavin.rocks/", {
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as Array<{ api_url?: string; name?: string }>;
    const urls = data
      .map((i) => i.api_url)
      .filter((u): u is string => !!u && u.startsWith("https://"));
    if (urls.length > 0) {
      PIPED_INSTANCES = urls;
      instancesLastFetched = Date.now();
    }
  } catch {
    // 실패해도 기존 목록 유지
  }
}

interface PipedAudioStream {
  url: string;
  bitrate: number;
  mimeType: string;
  codec: string;
  quality: string;
}

interface PipedStreamResponse {
  title: string;
  uploader: string;
  uploaderUrl: string;
  duration: number;
  thumbnailUrl: string;
  audioStreams: PipedAudioStream[];
}

interface PipedPlaylistStream {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploaderName: string;
}

interface PipedPlaylistResponse {
  name: string;
  thumbnailUrl: string;
  relatedStreams: PipedPlaylistStream[];
  nextpage: string | null;
}

async function pipedFetch(path: string): Promise<unknown> {
  await refreshInstances();
  let lastError: Error | null = null;

  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("All Piped instances failed");
}

export async function getAudioStream(
  videoId: string,
): Promise<{ url: string; duration: number; mimeType: string }> {
  const data = (await pipedFetch(`/streams/${videoId}`)) as PipedStreamResponse;

  if (!data.audioStreams || data.audioStreams.length === 0) {
    throw new Error("No audio streams available");
  }

  const preferred = data.audioStreams
    .filter((s) => s.mimeType.includes("audio"))
    .sort((a, b) => b.bitrate - a.bitrate);

  const opus = preferred.find((s) => s.codec === "opus");
  const selected = opus ?? preferred[0];

  return {
    url: selected.url,
    duration: data.duration,
    mimeType: selected.mimeType,
  };
}

function extractVideoId(pipedUrl: string): string | null {
  const match = pipedUrl.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export async function getPlaylistTracks(
  playlistId: string,
): Promise<{ title: string; tracks: Track[] }> {
  const data = (await pipedFetch(
    `/playlists/${playlistId}`,
  )) as PipedPlaylistResponse;

  const tracks: Track[] = data.relatedStreams
    .map((item) => {
      const videoId = extractVideoId(item.url);
      if (!videoId) return null;
      return {
        id: videoId,
        title: item.title,
        thumbnail: item.thumbnail || getThumbnailUrl(videoId),
        duration: item.duration,
        channel: item.uploaderName ?? "Unknown",
      };
    })
    .filter((t): t is Track => t !== null);

  return { title: data.name, tracks };
}

export async function getVideoInfo(videoId: string): Promise<Track> {
  const data = (await pipedFetch(`/streams/${videoId}`)) as PipedStreamResponse;

  return {
    id: videoId,
    title: data.title,
    thumbnail: data.thumbnailUrl || getThumbnailUrl(videoId),
    duration: data.duration,
    channel: data.uploader ?? "Unknown",
  };
}
