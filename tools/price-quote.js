#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// price-quote.js — CALCULATEUR DE DEVIS INSTANTANÉ (réponses <1h)
// Usage: node price-quote.js <type> [complexité]
//   types: inspect-free | audit-b2b | audit-plus | custom
// Sortie: prix + délai + texte de devis prêt à envoyer.
// ─────────────────────────────────────────────
const CATALOG = {
  "inspect-free": { usd: 0, delay: "10 secondes", what: "Verdict automatique: manifest, llms.txt, test 402 réel" },
  "audit-b2b":    { usd: 5,  delay: "moins de 24h",  what: "Audit complet: conformité spec officielle @x402/paywall v2.23, défauts documentés avec preuves curl, correctifs recommandés" },
  "audit-plus":   { usd: 25, delay: "48h",           what: "Audit B2B + suivi mensuel 3 mois + re-audit après vos correctifs" },
};
const COMPLEXITY_MULT = { simple: 1, medium: 1.5, complex: 2 };

(async () => {
  const [type, complexity] = process.argv.slice(2);
  if (!type || !CATALOG[type]) {
    console.log("Usage: price-quote.js <inspect-free|audit-b2b|audit-plus|custom> [simple|medium|complex]");
    console.log("\nCatalogue standard:");
    Object.entries(CATALOG).forEach(([k, v]) => console.log(`  ${k.padEnd(14)} $${v.usd} — ${v.delay}`));
    process.exit(1);
  }
  if (type === "custom") {
    const mult = COMPLEXITY_MULT[complexity] || 1;
    // Custom = jamais sous le plancher $5; base 15$
    const price = Math.max(5, Math.round(15 * mult));
    console.log(`=== DEVIS CUSTOM (${complexity || "medium"}) ===`);
    console.log(`Prix proposé: $${price} USD`);
    console.log("Texte prêt à envoyer:");
    console.log(`\nPour ce périmètre spécifique, je propose un forfait de $${price} USD payable en USDC/x402.\nLivrable: diagnostic documenté + correctifs recommandés, sous 72h.\nUn acompte n'est pas nécessaire — tu paies à la livraison si le rapport te convient.\n\n— automaton-alpha · ERC-8004 #67574`);
    process.exit(0);
  }
  const c = CATALOG[type];
  console.log(`=== DEVIS ${type.toUpperCase()} ===`);
  console.log(`Prix: $${c.usd} USD${c.usd === 0 ? " (gratuit)" : ""}`);
  console.log(`Délai: ${c.delay}`);
  console.log(`Contenu: ${c.what}`);
  if (c.usd > 0) console.log(`Facture: node invoice-gen.js <client> "${c.what}" ${c.usd}`);
})();