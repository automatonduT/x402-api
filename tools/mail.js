#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// mail.js — CANAL EMAIL d'automaton-alpha (IMAP/SMTP Gmail)
// Usage:
//   node mail.js send <destinataire> <sujet> <corps>     → envoyer
//   node mail.js check [N]                               → lire les N derniers (défaut 5)
//   node mail.js reply <messageId> <corps>               → répondre à un message
// Credentials: variables GMAIL_ADDRESS / GMAIL_APP_PASSWORD du .env
// ─────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

function creds() {
  // Lit le .env de l'agent (~/.automaton/.env)
  const env = fs.readFileSync(path.join(process.env.HOME, ".automaton", ".env"), "utf8");
  const get = k => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
  return { user: get("GMAIL_ADDRESS"), pass: get("GMAIL_APP_PASSWORD") };
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  const { user, pass } = creds();
  if (!user || !pass) { console.error("❌ credentials absents du .env"); process.exit(1); }

  if (cmd === "send") {
    const [to, subject, ...body] = args;
    if (!to || !subject) { console.error("Usage: node mail.js send <to> <subject> <body>"); process.exit(1); }
    const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
    const info = await t.sendMail({
      from: `"automaton-alpha (ERC-8004 #67574)" <${user}>`,
      to, subject,
      text: body.join(" ") +
        "\n\n—\nautomaton-alpha · autonomous agent · ERC-8004 #67574 (Base)\nStorefront: https://skintight-snowcap-underarm.ngrok-free.dev"
    });
    console.log("✅ envoyé:", info.messageId);

  } else if (cmd === "check") {
    const { ImapFlow } = require("imapflow");
    const c = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user, pass }, logger: false });
    await c.connect();
    const lock = await c.getMailboxLock("INBOX");
    try {
      const n = c.mailbox.exists;
      console.log(`📬 ${n} messages au total — derniers ${args[0] || 5}:`);
      const fetchCount = Math.min(parseInt(args[0] || "5"), n);
      for await (const msg of c.fetch({ seq: `${n - fetchCount + 1}:${n}` }, { envelope: true, uid: true })) {
        const from = msg.envelope.from?.[0];
        console.log(`\n#${msg.seq} [${msg.uid}] ${from ? from.address : "?"}`);
        console.log(`   Sujet: ${msg.envelope.subject || "(sans)"}`);
        console.log(`   Date: ${msg.envelope.date?.toISOString?.().slice(0, 16) || "?"}`);
      }
      console.log("\nPour lire un corps complet: node mail.js read <uid>");
    } finally { lock.release(); await c.logout(); }

  } else if (cmd === "read") {
    const { ImapFlow } = require("imapflow");
    const c = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user, pass }, logger: false });
    await c.connect();
    const lock = await c.getMailboxLock("INBOX");
    try {
      const msg = await c.fetchOne(args[0], { source: true, envelope: true });
      console.log("De:", msg.envelope.from?.[0]?.address);
      console.log("Sujet:", msg.envelope.subject);
      console.log("---\n" + msg.source.toString().slice(0, 3000));
    } finally { lock.release(); await c.logout(); }

  } else {
    console.log("Usage:\n  node mail.js send <to> <subject> <body>\n  node mail.js check [N]\n  node mail.js read <uid>");
  }
})().catch(e => { console.error("❌", e.message); process.exit(1); });
