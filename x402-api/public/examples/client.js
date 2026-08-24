// micro-tools minimal Node client (zero deps, node >= 18).
const BASE = process.env.MICROTOOLS_BASE || "https://completely-contrast-corporations-decorative.trycloudflare.com";

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { "User-Agent": "my-agent/0.1" } });
  return { status: r.status, body: await r.text() };
}

(async () => {
  console.log((await get("/tools/time")).body);                          // free util
  console.log((await get("/tools/hash", { data: "hello", algo: "sha256" })).body);
  const q = await get("/tools/market/quote", { symbol: "ETHUSDT" });     // market sim
  console.log(q.status, q.body.slice(0, 200));
})();
