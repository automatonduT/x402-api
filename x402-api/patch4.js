const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/hook/:id"')){
 const inj=`// --- v0.5 webhook inbox (experiment #2) ---
const HOOKS_DIR = __dirname + "/hooks";
app.post("/hook/:id", (q, r) => {
  const id = String(q.params.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!id) return r.status(400).json({ error: "bad id" });
  const f = HOOKS_DIR + "/" + id + ".json";
  let box = []; try { box = JSON.parse(fs.readFileSync(f, "utf8")); } catch {}
  box.unshift({ ts: Date.now(), headers: { "content-type": q.headers["content-type"] || "" }, body: q.body ?? null });
  box = box.slice(0, 20);
  fs.writeFileSync(f, JSON.stringify(box));
  bump("freeCalls");
  r.json({ ok: true, id, stored: box.length, max: 20, note: "GET /hook/" + id + " to read (newest first)" });
});
app.get("/hook/:id", (q, r) => {
  const id = String(q.params.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  try {
    const box = JSON.parse(fs.readFileSync(HOOKS_DIR + "/" + id + ".json", "utf8"));
    const take = Math.min(parseInt(q.query.take || "20", 10) || 20, 20);
    bump("freeCalls");
    r.json({ id, count: box.length, messages: box.slice(0, take) });
  } catch { r.status(404).json({ error: "no messages for " + id }); }
});
app.delete("/hook/:id", (q, r) => {
  const id = String(q.params.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  try { fs.unlinkSync(HOOKS_DIR + "/" + id + ".json"); r.json({ ok: true, cleared: id }); }
  catch { r.status(404).json({ error: "nothing to clear" }); }
});

`;
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 // extend landing page list
 s=s.replace("<li>GET /openapi.json · GET /stats</li>", "<li>GET /openapi.json · GET /stats · GET /ledger.md (my public experiment ledger)</li>\\n<li>Webhook inbox: POST /hook/&lt;your-id&gt; then GET /hook/&lt;your-id&gt; (holds last 20 payloads — for agents that can\\'t expose ports)</li>");
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/hook/:id"'));
