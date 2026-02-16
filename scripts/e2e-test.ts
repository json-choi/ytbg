/**
 * E2E test for ytbg innertube backend
 * Run: bun run scripts/e2e-test.ts [base_url]
 *
 * Note: YouTube's innertube API has aggressive bot detection.
 * Rapid sequential requests from the same IP trigger LOGIN_REQUIRED.
 * Tests use a single stream request + delay to avoid rate limits.
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";
const TEST_PLAYLIST = "PLRqwX-V7Uu6ZiZxtDDRCi6uhfTH4FilpH";
const TEST_VIDEO_ID = "dQw4w9WgXcQ";
const TIMEOUT = 20000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<string>) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, pass: true, detail, duration: Date.now() - start });
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, pass: false, detail: msg, duration: Date.now() - start });
    console.log(`  ❌ ${name}: ${msg} (${Date.now() - start}ms)`);
  }
}

async function main() {
  console.log(`\n🔍 ytbg E2E Test — ${BASE_URL}\n`);

  // 1. Parse playlist
  await test("POST /api/parse — playlist", async () => {
    const res = await fetch(`${BASE_URL}/api/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://www.youtube.com/playlist?list=${TEST_PLAYLIST}`,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.tracks || data.tracks.length === 0)
      throw new Error("No tracks returned");
    return `${data.tracks.length} tracks, first: ${data.tracks[0].id}`;
  });

  // 2. Parse single video
  await test("POST /api/parse — single video", async () => {
    const res = await fetch(`${BASE_URL}/api/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${TEST_VIDEO_ID}`,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.tracks || data.tracks.length !== 1)
      throw new Error("Expected 1 track");
    return `title: ${data.tracks[0].title}`;
  });

  // 3. Stream API — get audio URL (use known-good TEST_VIDEO_ID to avoid rate limit)
  // Delay before innertube request to reduce bot detection risk
  await sleep(2000);
  let audioUrl = "";

  await test("POST /api/stream — innertube audio URL", async () => {
    const res = await fetch(`${BASE_URL}/api/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: TEST_VIDEO_ID }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.url) throw new Error("No URL in response");
    audioUrl = data.url;
    return `bitrate=${data.bitrate}, duration=${data.duration}s, mime=${data.mimeType}`;
  });

  // 4. Verify audio URL responds with audio content
  await test("HEAD audio URL — content-type check", async () => {
    if (!audioUrl) throw new Error("No audio URL from previous test");
    const res = await fetch(audioUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "com.google.android.apps.youtube.vr.oculus/1.71.26 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("audio/")) throw new Error(`Unexpected content-type: ${ct}`);
    const cl = res.headers.get("content-length");
    return `content-type=${ct}, size=${cl || "unknown"}`;
  });

  // 5. Proxy endpoint
  await test("GET /api/proxy — CORS proxy", async () => {
    if (!audioUrl) throw new Error("No audio URL from previous test");
    const proxyUrl = `${BASE_URL}/api/proxy?url=${encodeURIComponent(audioUrl)}`;
    const res = await fetch(proxyUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    return `proxied content-type=${ct}`;
  });

  // 6. Stream API error handling
  await test("POST /api/stream — invalid videoId", async () => {
    const res = await fetch(`${BASE_URL}/api/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: "invalid" }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (res.ok) throw new Error("Expected error for invalid videoId");
    return `status=${res.status}`;
  });

  // Summary
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n${"=".repeat(50)}`);
  console.log(`\n📊 Results: ${passed}/${total} passed\n`);

  if (passed < total) {
    console.log("Failed tests:");
    results
      .filter((r) => !r.pass)
      .forEach((r) => console.log(`  • ${r.name}: ${r.detail}`));
    process.exit(1);
  }

  console.log("✅ All tests passed!");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
