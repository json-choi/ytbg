import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player";

interface InnertubeFormat {
  itag: number;
  url?: string;
  mimeType: string;
  bitrate: number;
  contentLength?: string;
  approxDurationMs?: string;
  audioQuality?: string;
  audioSampleRate?: string;
}

interface InnertubeResponse {
  playabilityStatus: {
    status: string;
    reason?: string;
  };
  streamingData?: {
    adaptiveFormats?: InnertubeFormat[];
    formats?: InnertubeFormat[];
    expiresInSeconds?: string;
  };
  videoDetails?: {
    videoId: string;
    title: string;
    lengthSeconds: string;
    channelId: string;
    shortDescription: string;
    thumbnail: {
      thumbnails: Array<{ url: string; width: number; height: number }>;
    };
    author: string;
  };
}

interface ClientConfig {
  name: string;
  userAgent: string;
  body: Record<string, unknown>;
}

function getClients(videoId: string): ClientConfig[] {
  return [
    {
      name: "ANDROID_VR",
      userAgent:
        "com.google.android.apps.youtube.vr.oculus/1.71.26 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
      body: {
        videoId,
        context: {
          client: {
            clientName: "ANDROID_VR",
            clientVersion: "1.71.26",
            deviceMake: "Oculus",
            deviceModel: "Quest 3",
            androidSdkVersion: 32,
            osName: "Android",
            osVersion: "12L",
          },
        },
        playbackContext: {
          contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" },
        },
        contentCheckOk: true,
        racyCheckOk: true,
      },
    },
    {
      name: "WEB_EMBEDDED_PLAYER",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      body: {
        videoId,
        context: {
          client: {
            clientName: "WEB_EMBEDDED_PLAYER",
            clientVersion: "1.20260115.01.00",
          },
          thirdParty: { embedUrl: "https://www.youtube.com/" },
        },
        playbackContext: {
          contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" },
        },
        contentCheckOk: true,
        racyCheckOk: true,
      },
    },
  ];
}

function pickBestAudio(formats: InnertubeFormat[]): InnertubeFormat | null {
  const audioFormats = formats.filter(
    (f) => f.mimeType.startsWith("audio/") && f.url,
  );

  if (audioFormats.length === 0) return null;

  // Prefer mp4a.40.2 (AAC-LC) ~128kbps for compatibility + quality balance
  const aac = audioFormats
    .filter((f) => f.mimeType.includes("mp4a.40.2"))
    .sort((a, b) => Math.abs(a.bitrate - 128000) - Math.abs(b.bitrate - 128000));

  if (aac.length > 0) return aac[0];

  return audioFormats.sort((a, b) => b.bitrate - a.bitrate)[0];
}

async function tryClient(
  client: ClientConfig,
): Promise<{ data: InnertubeResponse; ok: boolean }> {
  const res = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": client.userAgent,
    },
    body: JSON.stringify(client.body),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return { data: {} as InnertubeResponse, ok: false };

  const data = (await res.json()) as InnertubeResponse;

  if (data.playabilityStatus?.status !== "OK") return { data, ok: false };
  if (!data.streamingData?.adaptiveFormats?.length && !data.streamingData?.formats?.length) {
    return { data, ok: false };
  }

  return { data, ok: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const videoId = body.videoId as string;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        { error: "Invalid videoId" },
        { status: 400 },
      );
    }

    const clients = getClients(videoId);
    let lastError = "No clients succeeded";

    for (const client of clients) {
      try {
        const { data, ok } = await tryClient(client);

        if (!ok) {
          lastError = data.playabilityStatus?.reason || data.playabilityStatus?.status || `${client.name} failed`;
          continue;
        }

        const allFormats = [
          ...(data.streamingData?.adaptiveFormats || []),
          ...(data.streamingData?.formats || []),
        ];

        const audio = pickBestAudio(allFormats);
        if (!audio?.url) {
          lastError = `${client.name}: no audio formats`;
          continue;
        }

        const durationMs = audio.approxDurationMs
          ? parseInt(audio.approxDurationMs, 10)
          : data.videoDetails?.lengthSeconds
            ? parseInt(data.videoDetails.lengthSeconds, 10) * 1000
            : 0;

        return NextResponse.json({
          url: audio.url,
          mimeType: audio.mimeType,
          bitrate: audio.bitrate,
          duration: Math.round(durationMs / 1000),
          title: data.videoDetails?.title || "Unknown",
          author: data.videoDetails?.author || "Unknown",
          expiresInSeconds: data.streamingData?.expiresInSeconds
            ? parseInt(data.streamingData.expiresInSeconds, 10)
            : 21600,
        });
      } catch {
        lastError = `${client.name}: request error`;
      }
    }

    return NextResponse.json({ error: lastError }, { status: 403 });
  } catch (error) {
    console.error("Stream API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get audio stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
