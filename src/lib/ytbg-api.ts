const SERVER_URL =
  process.env.NEXT_PUBLIC_YTBG_SERVER_URL ||
  "https://hearty-connection-production-01b9.up.railway.app";

export interface TrackInfo {
  title: string;
  duration: number;
  thumbnail: string;
}

export interface ConvertResult {
  blob: Blob;
  title: string;
  duration: number;
  thumbnail: string;
}

export async function getInfo(url: string): Promise<TrackInfo> {
  const res = await fetch(`${SERVER_URL}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Info request failed: ${err}`);
  }

  const data = await res.json();
  return {
    title: data.title,
    duration: data.duration,
    thumbnail: data.thumbnail,
  };
}

export async function convertToMp3(
  url: string,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  const res = await fetch(`${SERVER_URL}/api/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Convert request failed: ${err}`);
  }

  const title = decodeURIComponent(res.headers.get("X-Title") || "Unknown");
  const duration = Number(res.headers.get("X-Duration") || "0");
  const thumbnail = decodeURIComponent(res.headers.get("X-Thumbnail") || "");

  const contentLength = res.headers.get("Content-Length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!res.body || !total || !onProgress) {
    // No streaming progress — just read the whole blob
    const blob = await res.blob();
    onProgress?.(100);
    return { blob, title, duration, thumbnail };
  }

  // Stream with progress
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(99, Math.round((received / total) * 100)));
  }

  onProgress(100);
  const blob = new Blob(chunks as unknown as BlobPart[], { type: "audio/mpeg" });
  return { blob, title, duration, thumbnail };
}
