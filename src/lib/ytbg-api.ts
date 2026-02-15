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

interface CobaltResponse {
  status: "tunnel" | "redirect" | "picker" | "error";
  url?: string;
  filename?: string;
  error?: string;
}

export async function convertToMp3(
  url: string,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  onProgress?.(10);

  // Step 1: Ask Cobalt for audio download URL
  const cobaltRes = await fetch(`${SERVER_URL}/`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      downloadMode: "audio",
      audioFormat: "mp3",
      audioBitrate: "128",
    }),
  });

  if (!cobaltRes.ok) {
    const err = await cobaltRes.text().catch(() => "Unknown error");
    throw new Error(`Cobalt request failed: ${err}`);
  }

  const cobaltData = (await cobaltRes.json()) as CobaltResponse;

  if (cobaltData.status === "error") {
    throw new Error(cobaltData.error || "Cobalt processing error");
  }

  const downloadUrl = cobaltData.url;
  if (!downloadUrl) {
    throw new Error("No download URL returned from Cobalt");
  }

  onProgress?.(30);

  // Step 2: Download the actual MP3 file via Cobalt tunnel
  const audioRes = await fetch(downloadUrl);
  if (!audioRes.ok) {
    throw new Error(`Audio download failed: ${audioRes.status}`);
  }

  const contentLength = audioRes.headers.get("Content-Length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!audioRes.body || !total || !onProgress) {
    const blob = await audioRes.blob();
    onProgress?.(100);
    const title = cobaltData.filename?.replace(/\.mp3$/i, "") || "Unknown";
    return { blob, title, duration: 0, thumbnail: "" };
  }

  // Stream with progress
  const reader = audioRes.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const pct = 30 + Math.round((received / total) * 70);
    onProgress(Math.min(99, pct));
  }

  onProgress(100);
  const blob = new Blob(chunks as unknown as BlobPart[], { type: "audio/mpeg" });
  const title = cobaltData.filename?.replace(/\.mp3$/i, "") || "Unknown";
  return { blob, title, duration: 0, thumbnail: "" };
}
