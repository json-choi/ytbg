/**
 * YouTube 오디오 스트림 백엔드 테스트
 * 각 방법을 시도해서 실제로 오디오 URL이 나오는지 검증
 * 
 * 실행: bun run scripts/test-backends.ts
 */

const TEST_VIDEO_ID = "dQw4w9WgXcQ"; // Rick Astley
const TIMEOUT = 10000;

interface TestResult {
  method: string;
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
  latency: number;
}

async function testPipedInstance(instance: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${instance}/streams/${TEST_VIDEO_ID}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as any;
    const streams = data.audioStreams || [];
    if (streams.length === 0) throw new Error("No audio streams");
    const best = streams.reduce((a: any, b: any) => (a.bitrate > b.bitrate ? a : b));
    return { method: `Piped: ${instance}`, success: true, audioUrl: best.url?.substring(0, 80) + "...", duration: data.duration, latency: Date.now() - start };
  } catch (e: any) {
    return { method: `Piped: ${instance}`, success: false, error: e.message, latency: Date.now() - start };
  }
}

async function testInvidiousInstance(instance: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${instance}/api/v1/videos/${TEST_VIDEO_ID}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as any;
    const formats = (data.adaptiveFormats || []).filter((f: any) => f.type?.startsWith("audio/"));
    if (formats.length === 0) throw new Error("No audio formats");
    const best = formats.reduce((a: any, b: any) => ((a.bitrate || 0) > (b.bitrate || 0) ? a : b));
    return { method: `Invidious: ${instance}`, success: true, audioUrl: best.url?.substring(0, 80) + "...", duration: data.lengthSeconds, latency: Date.now() - start };
  } catch (e: any) {
    return { method: `Invidious: ${instance}`, success: false, error: e.message, latency: Date.now() - start };
  }
}

async function testYouTubeOEmbed(): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${TEST_VIDEO_ID}&format=json`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as any;
    return { method: "YouTube oEmbed (metadata only)", success: true, audioUrl: "N/A (no audio URL)", duration: undefined, latency: Date.now() - start };
  } catch (e: any) {
    return { method: "YouTube oEmbed", success: false, error: e.message, latency: Date.now() - start };
  }
}

async function testGoogleVideoProxy(): Promise<TestResult> {
  const start = Date.now();
  try {
    // YouTube의 get_video_info endpoint (deprecated but sometimes works)
    const res = await fetch(`https://www.youtube.com/get_video_info?video_id=${TEST_VIDEO_ID}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return { method: "YouTube get_video_info", success: text.length > 100, audioUrl: text.substring(0, 80), latency: Date.now() - start };
  } catch (e: any) {
    return { method: "YouTube get_video_info", success: false, error: e.message, latency: Date.now() - start };
  }
}

async function discoverPipedInstances(): Promise<string[]> {
  try {
    const res = await fetch("https://piped-instances.kavin.rocks/", { signal: AbortSignal.timeout(5000) });
    const data = await res.json() as Array<{ api_url?: string }>;
    return data.map(i => i.api_url).filter((u): u is string => !!u && u.startsWith("https://"));
  } catch {
    return [];
  }
}

async function discoverInvidiousInstances(): Promise<string[]> {
  try {
    const res = await fetch("https://api.invidious.io/instances.json", { signal: AbortSignal.timeout(5000) });
    const data = await res.json() as Array<[string, { api: boolean; uri: string; type: string }]>;
    return data
      .filter(([, info]) => info.type === "https")
      .map(([, info]) => info.uri)
      .slice(0, 15);
  } catch {
    return [];
  }
}

async function main() {
  console.log("🔍 YouTube 오디오 스트림 백엔드 테스트");
  console.log(`📹 테스트 영상: ${TEST_VIDEO_ID}\n`);

  // 인스턴스 목록 가져오기
  console.log("📡 인스턴스 목록 수집 중...");
  const [pipedInstances, invidiousInstances] = await Promise.all([
    discoverPipedInstances(),
    discoverInvidiousInstances(),
  ]);
  console.log(`  Piped: ${pipedInstances.length}개, Invidious: ${invidiousInstances.length}개\n`);

  const results: TestResult[] = [];

  // Piped 테스트
  console.log("🟢 Piped API 테스트...");
  for (const instance of pipedInstances) {
    const result = await testPipedInstance(instance);
    results.push(result);
    const icon = result.success ? "✅" : "❌";
    console.log(`  ${icon} ${instance} — ${result.success ? `${result.latency}ms` : result.error}`);
  }

  // Invidious 테스트
  console.log("\n🟡 Invidious API 테스트...");
  for (const instance of invidiousInstances) {
    const result = await testInvidiousInstance(instance);
    results.push(result);
    const icon = result.success ? "✅" : "❌";
    console.log(`  ${icon} ${instance} — ${result.success ? `${result.latency}ms` : result.error}`);
  }

  // 기타 방법 테스트
  console.log("\n🔵 기타 방법 테스트...");
  const other = await testYouTubeOEmbed();
  results.push(other);
  console.log(`  ${other.success ? "✅" : "❌"} ${other.method} — ${other.success ? `${other.latency}ms` : other.error}`);

  const gvi = await testGoogleVideoProxy();
  results.push(gvi);
  console.log(`  ${gvi.success ? "✅" : "❌"} ${gvi.method} — ${gvi.success ? `${gvi.latency}ms` : gvi.error}`);

  // 결과 요약
  const working = results.filter(r => r.success && r.audioUrl !== "N/A (no audio URL)");
  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 결과: ${working.length}/${results.length} 작동\n`);

  if (working.length > 0) {
    console.log("✅ 작동하는 백엔드:");
    working
      .sort((a, b) => a.latency - b.latency)
      .forEach(r => console.log(`  • ${r.method} (${r.latency}ms)`));
  } else {
    console.log("❌ 작동하는 백엔드 없음");
  }
}

main().catch(console.error);
