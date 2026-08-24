#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// infra-suite.js — SANTÉ DE L'INFRASTRUCTURE
// Usage: errors [h] · latency <path> · disk-watch · proc-watch · port-audit · dep-outdated
//        secret-scan [dir] · dns-check <domaine> · log-rotate [j] · health-report · backup-verify
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const http = require("http");
const { execSync } = require("child_process");
const HOME = process.env.HOME;

function local(p, timeout = 6000) {
  return new Promise(res => {
    const req = http.get({ host: "localhost", port: 4020, path: p || "/", timeout }, r => { r.resume(); res(r.statusCode); });
    req.on("error", () => res(0)); req.on("timeout", () => { req.destroy(); res(0); });
  });
}

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  try {
    if (cmd === "errors") {
      const since = Date.now() - (+(a[0] || 24)) * 3600e3;
      const dir = path.join(HOME, ".automaton", "logs");
      const counts = {};
      let latest = {};
      for (const f of fs.readdirSync(dir).sort().reverse().slice(0, 3)) {
        const src = fs.readFileSync(path.join(dir, f), "utf8").split("\n");
        for (const l of src) {
          const m = l.match(/^(\d{4}-\d{2}-\d{2}T[\d:]+)/);
          if (!m || new Date(m[1]).getTime() < since) continue;
          const lvl = l.includes("ERROR") ? "ERROR" : l.includes("WARN") ? "WARN" : null;
          if (!lvl) continue;
          const key = (l.match(/message":"([^"]{0,60})/) || [, l.slice(30, 90)])[1];
          counts[key] = (counts[key] || 0) + 1; latest[key] = m[1].slice(11, 19);
        }
      }
      const top = Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 5);
      if (!top.length) return console.log("✅ zéro erreur/avertissement récents");
      top.forEach(([k, n]) => console.log(`⚠️ ×${n} (dernier ${latest[k]}) ${k}`));
    } else if (cmd === "latency") {
      const p = a[0] || "/health"; const n = +(a[1] || 5); const times = [];
      for (let i = 0; i < n; i++) { const t0 = Date.now(); await local(p); times.push(Date.now() - t0); }
      const avg = times.reduce((s, x) => s + x) / n;
      console.log(`${p}: avg ${avg.toFixed(0)}ms · min ${Math.min(...times)} · max ${Math.max(...times)} → ${avg > 1500 ? "🔴 lent" : avg > 500 ? "🟡 moyen" : "🟢 rapide"}`);
    } else if (cmd === "disk-watch") {
      const out = execSync("df -h /").toString().split("\n")[1].split(/\s+/);
      const pct = parseInt(out[4]);
      console.log(`Disque: ${out[3]} libres sur ${out[1]} (${pct}% utilisé) → ${pct > +(a[0] || 80) ? "🔴 seuil dépassé — purge les logs/vieux backups" : "✅ OK"}`);
    } else if (cmd === "proc-watch") {
      const checks = [["agent", "dist/index.js --run"], ["serveur 4020", "server.js"], ["ngrok", "ngrok"]];
      checks.forEach(([name, pat]) => {
        let alive = false;
        try { alive = execSync(`pgrep -f "${pat}" | head -1`).toString().trim().length > 0; } catch (e) {}
        console.log(`${alive ? "✅" : "❌"} ${name}`);
      });
    } else if (cmd === "port-audit") {
      for (const p of [4020, 4021]) {
        try { execSync(`lsof -i :${p} | grep LISTEN`); console.log(`✅ port ${p} en écoute`); }
        catch (e) { console.log(`❌ port ${p} SILENCIEUX — le service est down`); }
      }
    } else if (cmd === "dep-outdated") {
      const pkg = JSON.parse(fs.readFileSync(path.join(HOME, "automaton-work", "tools", "package.json"), "utf8"));
      for (const [dep, ver] of Object.entries(pkg.dependencies || {})) {
        try {
          const latest = JSON.parse(await new Promise((res, rej) => require("https").get(`https://registry.npmjs.org/${dep}/latest`, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej))).version;
          const cur = ver.replace(/[^0-9.]/g, "");
          console.log(`${latest !== cur ? "⬆️" : "✅"} ${dep}: installé ${cur} · latest ${latest}`);
        } catch (e) { console.log(`? ${dep}: registry injoignable`); }
      }
    } else if (cmd === "secret-scan") {
      const dir = a[0] || path.join(HOME, "automaton-work");
      const patterns = [/ghp_[A-Za-z0-9]{36}/, /sk-[A-Za-z0-9]{20,}/, /\b[0-9a-f]{64}\b/, /(password|secret|token)\s*[:=]\s*['"][^'"]{8,}/i];
      let found = 0;
      const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        const f = path.join(d, e.name);
        if (e.isDirectory()) { if (!/node_modules|\.git|backups/.test(e.name)) walk(f); return; }
        if (!/\.(js|json|md|html|sh|txt)$/.test(e.name)) return;
        try {
          const src = fs.readFileSync(f, "utf8");
          patterns.forEach((p, i) => { if (p.test(src)) { console.log(`🚨 pattern #${i + 1} dans ${f}`); found++; } });
        } catch (_) {}
      });
      walk(dir);
      console.log(found ? `🚨 ${found} suspicion(s) — NE PUSHE PAS avant nettoyage` : "✅ aucun pattern de secret détecté");
      process.exit(found ? 1 : 0);
    } else if (cmd === "dns-check") {
      require("dns").resolve(a[0], (err, addrs) =>
        console.log(err ? `❌ ${a[0]} ne résout pas (${err.code})` : `✅ ${a[0]} → ${addrs.join(", ")}`));
    } else if (cmd === "log-rotate") {
      const days = +(a[0] || 7); const dir = path.join(HOME, ".automaton", "logs"); let n = 0;
      fs.readdirSync(dir).forEach(f => {
        const f_ = path.join(dir, f);
        if (Date.now() - fs.statSync(f_).mtimeMs > days * 864e5 && !f.endsWith(".gz")) {
          execSync(`gzip "${f_}"`); n++;
        }
      });
      console.log(`🗜️ ${n} logs compressés (> ${days}j). Les .gz > 30j: rm manuel ou cron.`);
    } else if (cmd === "health-report") {
      const code = await local("/health");
      const diskPct = parseInt(execSync("df -h /").toString().split("\n")[1].split(/\s+/)[4]);
      let agentAlive = false; try { agentAlive = !!execSync('pgrep -f "dist/index.js --run" | head -1').toString().trim(); } catch (e) {}
      const score = (code === 200 ? 1 : 0) + (diskPct < 80 ? 1 : 0) + (agentAlive ? 1 : 0);
      console.log(`Santé globale: ${["🔴 CRITIQUE", "🟠 DÉGRADÉ", "🟡 PARTIEL", "🟢 NOMINAL"][score]} — serveur ${code === 200 ? "OK" : "DOWN"} · disque ${diskPct}% · agent ${agentAlive ? "vivant" : "MORT"}`);
    } else if (cmd === "backup-verify") {
      const bdir = path.join(HOME, "automaton-backups");
      const snaps = fs.existsSync(bdir) ? fs.readdirSync(bdir).filter(d => d.startsWith("snapshot-")).sort().reverse() : [];
      if (!snaps.length) return console.log("❌ AUCUN backup !");
      const last = snaps[0]; const ageH = (Date.now() - fs.statSync(path.join(bdir, last)).mtimeMs) / 3600e3;
      const dbSize = fs.statSync(path.join(bdir, last, "state.db")).size / 1e6;
      console.log(`${ageH < 26 && dbSize > 1 ? "✅" : "🚨"} dernier backup: ${last} (${ageH.toFixed(0)}h) · state.db ${dbSize.toFixed(1)}MB`);
    } else {
      console.log("Usage: errors [h] · latency <path> · disk-watch · proc-watch · port-audit · dep-outdated · secret-scan · dns-check <d> · log-rotate [j] · health-report · backup-verify");
    }
  } catch (e) { console.error("❌", e.message); process.exit(1); }
})();