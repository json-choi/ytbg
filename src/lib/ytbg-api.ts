export interface AudioStreamResult {
  url: string;
  proxyUrl: string;
  mimeType: string;
  bitrate: number;
  duration: number;
  title: string;
  author: string;
  expiresAt: number;
}

interface StreamApiResponse {
  url: string;
  mimeType: string;
  bitrate: number;
  duration: number;
  title: string;
  author: string;
  expiresInSeconds: number;
  error?: string;
}

export async function getAudioStream(videoId: string): Promise<AudioStreamResult> {
  const res = await fetch("/api/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(data.error || `Stream request failed: ${res.status}`);
  }

  const data = (await res.json()) as StreamApiResponse;

  if (!data.url) {
    throw new Error("No audio URL returned");
  }

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(data.url)}`;
  const expiresAt = Date.now() + (data.expiresInSeconds || 21600) * 1000;

  return {
    url: data.url,
    proxyUrl,
    mimeType: data.mimeType,
    bitrate: data.bitrate,
    duration: data.duration,
    title: data.title,
    author: data.author,
    expiresAt,
  };
}
