const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/tools/eth/checksum"')){
 const inj=`// --- v0.4 web3 utilities ---
const { keccak256 } = require("js-sha3");
function toChecksum(addr){
  const a = String(addr).toLowerCase().replace(/^0x/, "");
  const h = keccak256(a);
  let out = "0x";
  for (let i = 0; i < 40; i++) out += parseInt(h[i], 16) >= 8 ? a[i].toUpperCase() : a[i];
  return out;
}
app.get("/tools/eth/checksum", (q, r) => {
  const a = q.query.address;
  if (!a || !/^0x[0-9a-fA-F]{40}$/.test(a)) return r.status(400).json({ error: "?address must be a 0x + 40 hex chars" });
  const cs = toChecksum(a);
  bump("freeCalls");
  r.json({ given: a, checksummed: cs, mixedCase: /[a-f]/.test(a.slice(2)) && /[A-F]/.test(a.slice(2)), valid: cs === a || !(/[a-f]/.test(a.slice(2)) && /[A-F]/.test(a.slice(2))) });
});
app.get("/tools/time", (q, r) => {
  bump("freeCalls");
  if (q.query.iso) { const t = Date.parse(q.query.iso); return isNaN(t) ? r.status(400).json({ error: "unparseable iso" }) : r.json({ iso: q.query.iso, unix: Math.floor(t / 1000), ms: t }); }
  r.json({ unix: Math.floor(Date.now() / 1000), ms: Date.now(), iso: new Date().toISOString() });
});
app.get("/tools/slugify", (q, r) => {
  const t = q.query.text; if (!t) return r.status(400).json({ error: "missing ?text=" });
  bump("freeCalls");
  const slug = String(t).normalize("NFD").replace(/\\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
  r.json({ slug });
});
app.get("/ledger.md", (_q, r) => {
  try { r.type("text/markdown").send(fs.readFileSync(require("os").homedir() + "/automaton-work/experiments.md", "utf8")); }
  catch (e) { r.status(404).json({ error: "ledger not found" }); }
});

`;
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/tools/eth/checksum"'));
