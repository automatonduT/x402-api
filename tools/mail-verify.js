#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// mail-verify.js — VÉRIFICATION D'EMAILS avant envoi (anti-rebond)
// Usage:
//   node mail-verify.js check <email>              → l'adresse existe-t-elle ?
//   node mail-verify.js discover <domaine>         → trouver les emails du domaine
//   node mail-verify.js patterns <nom> <domaine>   → tester les patterns courants
//
// Techniques: DNS MX → SMTP RCPT TO (vérification sans envoi réel)
//             + scraping pages contact/team + patterns standards.
// Éthique: pour joindre des PROSPECTS qualifiés, jamais de spam massif.
// ─────────────────────────────────────────────
const dns = require("dns").promises;
const net = require("net");
const https = require("https");

function get(url) {
  return new Promise(res => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "research/1.0" } }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res({ status: r.statusCode, body: d }));
    }).on("error", () => res({ status: 0, body: "" }));
  });
}

// Vérifie si un serveur accepte une adresse (SMTP RCPT TO, sans DATA)
async function smtpVerify(email) {
  const domain = email.split("@")[1];
  let mx;
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords.length) return { verdict: "no-mx", detail: "domaine sans serveur mail" };
    mx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
  } catch (e) { return { verdict: "no-domain", detail: "domaine inexistant" }; }

  return new Promise(resolve => {
    const sock = net.createConnection(25, mx);
    let step = 0, result = null;
    const timeout = setTimeout(() => { sock.destroy(); resolve(result || { verdict: "timeout", detail: "serveur muet" }); }, 15000);

    const send = line => line && sock.write(line + "\r\n");
    sock.on("data", buf => {
      const resp = buf.toString();
      const code = parseInt(resp.slice(0, 3));
      step++;
      if (step === 1 && code === 220) send(`HELO verify.local`);
      else if (step === 2 && code === 250) send(`MAIL FROM:<verify@skintight-snowcap-underarm.ngrok-free.dev>`);
      else if (step === 3 && code === 250) send(`RCPT TO:<${email}>`);
      else if (step === 4) {
        // 250 = existe | 550/551/553 = n'existe pas | 25x autre = accept-all probable
        if (code === 250) result = { verdict: "valid", detail: "boîte confirmée par le serveur" };
        else if ([550, 551, 553].includes(code)) result = { verdict: "invalid", detail: "adresse rejetée (" + code + ")" };
        else result = { verdict: "accept-all", detail: "le serveur accepte tout — vérification impossible" };
        clearTimeout(timeout); send("QUIT"); sock.destroy(); resolve(result);
      } else if (code >= 400) {
        result = { verdict: "greylist", detail: "serveur prudent (" + code + ") — réessayer plus tard" };
        clearTimeout(timeout); sock.destroy(); resolve(result);
      }
    });
    sock.on("error", e => { clearTimeout(timeout); resolve(result || { verdict: "conn-error", detail: e.message.slice(0, 60) }); });
  });
}

// Découvre les emails publics sur les pages classiques d'un domaine
async function discover(domain) {
  const found = new Set();
  const paths = ["/", "/contact", "/team", "/about", "/support", "/.well-known/security.txt"];
  const re = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  for (const p of paths) {
    const r = await get(`https://${domain}${p}`);
    if (r.status !== 200) continue;
    const matches = r.body.match(re) || [];
    matches.filter(m => !/\.(png|jpg|gif|webp|example|test|sample|noreply|no-reply)/i.test(m))
           .forEach(m => found.add(m.toLowerCase()));
    if (found.size >= 5) break;
  }
  // GitHub org/user public email aussi
  return [...found];
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "check") {
    console.log("Vérification SMTP de", args[0], "...");
    console.log(JSON.stringify(await smtpVerify(args[0]), null, 2));
  } else if (cmd === "discover") {
    console.log("Recherche d'emails publics sur", args[0], "...");
    const emails = await discover(args[0]);
    console.log(emails.length ? emails.map(e => "• " + e).join("\n") : "(aucun email public trouvé)");
  } else if (cmd === "patterns") {
    const [name, domain] = args;
    const parts = name.toLowerCase().split(/\s+/);
    const cands = [
      `${parts[0]}@${domain}`, `${parts[0]}.${parts[1] || ""}@${domain}`.replace("..", "."),
      `${parts[0][0]}${parts[1] || ""}@${domain}`, `info@${domain}`, `contact@${domain}`,
      `hello@${domain}`, `support@${domain}`
    ];
    const uniq = [...new Set(cands)];
    console.log("Test de", uniq.length, "patterns pour", name, "@", domain, "...\n");
    for (const e of uniq) {
      const v = await smtpVerify(e);
      const icon = v.verdict === "valid" ? "✅" : v.verdict === "invalid" ? "❌" : "❓";
      console.log(`${icon} ${e} → ${v.verdict} (${v.detail})`);
    }
  } else {
    console.log("Usage:\n  node mail-verify.js check <email>\n  node mail-verify.js discover <domaine>\n  node mail-verify.js patterns <prenom nom> <domaine>");
  }
})();
