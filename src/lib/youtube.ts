const YOUTUBE_VIDEO_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const YOUTUBE_PLAYLIST_REGEX =
  /[?&]list=([a-zA-Z0-9_-]+)/;

export function parseYoutubeUrl(url: string): {
  type: "video" | "playlist" | "invalid";
  videoId?: string;
  playlistId?: string;
} {
  try {
    const trimmed = url.trim();
    const playlistMatch = trimmed.match(YOUTUBE_PLAYLIST_REGEX);
    const videoMatch = trimmed.match(YOUTUBE_VIDEO_REGEX);

    if (playlistMatch) {
      return {
        type: "playlist",
        playlistId: playlistMatch[1],
        videoId: videoMatch?.[1],
      };
    }

    if (videoMatch) {
      return { type: "video", videoId: videoMatch[1] };
    }

    return { type: "invalid" };
  } catch {
    return { type: "invalid" };
  }
}

export function getVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_VIDEO_REGEX);
  return match?.[1] ?? null;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
