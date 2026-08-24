#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// link-checker.js — DÉTECTEUR DE LIENS MORTS (sur TON site)
// Usage: node link-checker.js            → vérifie toutes les pages HTML publiques
// Un lien mort sur ta vitrine = friction = client perdu = ta règle violée.
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const http = require("http");

const PUB = path.join(process.env.HOME, "automaton-work", "x402-api", "public");
const LOCAL_RE = /^(\/[a-zA-Z0-9._/-]*|\.#.*)$/;

function checkLocal(p) {
  return new Promise(res => {
    http.get({ host: "localhost", port: 4020, path: p, timeout: 8000 }, r => res(r.statusCode)).on("error", () => res(0));
  });
}

(async () => {
  const files = fs.readdirSync(PUB).filter(f => f.endsWith(".html"));
  console.log(`=== LIENS MORTS — scan de ${files.length} pages ===\n`);
  let broken = 0, total = 0;
  const checked = new Set();

  for (const f of files) {
    const html = fs.readFileSync(path.join(PUB, f), "utf8");
    const hrefs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m => m[1])
      .filter(h => h && !h.startsWith("http") && !h.startsWith("mailto:") && LOCAL_RE.test(h));
    for (const h of [...new Set(hrefs)]) {
      if (checked.has(h)) continue;
      checked.add(h); total++;
      const code = await checkLocal(h);
      if (code === 404 || code === 0) {
        console.log(`❌ ${f} → ${h} (HTTP ${code})`);
        broken++;
      }
    }
  }
  console.log(`\n${broken === 0 ? "✅ ZÉRO lien mort sur " + total + " liens internes" : `🚨 ${broken}/${total} liens morts — corrige avant tout pitch`}`);
  process.exit(broken ? 1 : 0);
})();