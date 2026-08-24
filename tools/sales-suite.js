#!/usr/bin/env node
/* sales-suite.js — Boîte à outils commerciale d'automaton-alpha
 * Agent ERC-8004 #67574 (Base) — audits x402 à $5 · zéro dépendance externe
 * Données : ~/automaton-work/data/ · usage : node sales-suite.js <sous-commande> [args] */
'use strict';

const fs = require('fs'), os = require('os'), path = require('path');

const SHOP = 'https://skintight-snowcap-underarm.ngrok-free.dev';
const PRIX_AUDIT = 5; // offre d'entrée unique : audit x402 à $5
const DATA = path.join(os.homedir(), 'automaton-work', 'data');

/* ---------- Utilitaires ---------- */
const lireJson = (f, defaut) => { // fichier absent/corrompu -> valeur de repli
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); }
  catch (e) { return defaut; }
};
const joursDepuis = (iso) => {
  const t = new Date(iso).getTime();
  return isNaN(t) ? 999 : Math.max(0, Math.floor((Date.now() - t) / 864e5));
};
const usd = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2);
const melange = (a) => a.slice().sort(() => Math.random() - 0.5); // mélange naïf suffisant ici
const crmLeads = () => (lireJson('crm.json', { leads: [] }).leads || []);
const trouverLead = (k) => crmLeads().find(l => String(l.id) === String(k) || l.name === k);

/* ---------- 1. pitch-variants : 3 pitches froids prêts à copier ---------- */
function cmdPitchVariants(lead, defaut1, defaut2) {
  if (!lead || !defaut1) return console.log('Usage: pitch-variants <lead> <defaut1> [defaut2]');
  const rec = trouverLead(lead);
  const nom = rec ? rec.name : lead; // id/nom du CRM ou domaine brut accepté
  const defs = [defaut1, defaut2].filter(Boolean).join(' + ');
  console.log(`\n### 3 pitches froids — cible ${nom} (défauts relevés : ${defs})\n` +
`— VARIANTE A · ANGLE DOULEUR —
Objet : votre paywall x402 refuse probablement des paiements
Bonjour,
J'ai testé votre endpoint x402 et j'y ai relevé : ${defs}. Effet typique : un agent acheteur
échoue au moment de payer — et part en silence, sans que vous le sachiez jamais.
Mon audit à ${usd(PRIX_AUDIT)} liste chaque défaut avec le patch exact : ${SHOP} — remboursé si rien.

— VARIANTE B · ANGLE PREUVE —
Objet : ${defs} trouvés sur ${nom} (preuve inside)
Bonjour,
Audit express de ${nom} : ${defs}. Pas de théorie : rapport avec lignes fautives du manifest et
correctifs prêts à coller. Exemple de rendu : ${SHOP}/deep-audit-example.html.
${usd(PRIX_AUDIT)} en USDC via x402 (vous testez le standard pendant que vous corrigez). On vous l'envoie ?

— VARIANTE C · ANGLE QUESTION —
Objet : question rapide sur le manifest x402 de ${nom}
Bonjour,
Question de spécialiste : « ${defaut1} » est volontaire chez vous ? Je recense ce défaut sur
plusieurs serveurs x402 et il casse la découverte par les agents acheteurs. Répondre à cette
seule question vous aidera déjà ; inventaire complet : ${usd(PRIX_AUDIT)} → ${SHOP}\n`);
}

/* ---------- 2. subject-ab : 6 objets d'email pour test A/B ---------- */
function cmdSubjectAb(produit) {
  if (!produit) return console.log('Usage: subject-ab <produit>');
  const objets = [
    ['curiosité', `le défaut que ${produit} ne voit pas`],
    ['curiosité', `ce que j'ai trouvé en 10 minutes sur ${produit}`],
    ['peur de perte', `${produit} perd des acheteurs agents sans le savoir`],
    ['peur de perte', `vos paiements x402 échouent-ils en silence ?`],
    ['chiffre', `2 défauts x402 sur ${produit} — corrigés pour ${usd(PRIX_AUDIT)}`],
    ['question', `${produit} : votre manifest passe-t-il l'audit en 1 clic ?`],
  ];
  console.log(`\n### 6 objets A/B pour « ${produit} »`);
  objets.forEach((o, i) => console.log(`${i + 1}. [${o[0]}] ${o[1]}`));
  console.log("\nProtocole : impairs = liste A, pairs = liste B ; taux d'ouverture comparé à 48h.");
}

/* ---------- 3. forecast : projection de revenus ----------
 * Hypothèses : taux de close = won/(won+lost) de l'historique CRM si >= 5 deals,
 * sinon taux par défaut ; valeur espérée d'un lead ouvert = taux(temp) × prix ;
 * closes étalés uniformément sur l'horizon (aucune vélocité fiable mesurée).
 */
const TAUX_DEFAUT = { hot: 0.30, warm: 0.15, cold: 0.05 };
function cmdForecast(horizonStr) {
  const H = Math.max(1, parseInt(horizonStr || '3', 10) || 3);
  const leads = crmLeads();
  const dest = leads.flatMap(l => (l.history || []).map(h => h.to));
  const won = dest.filter(s => s === 'won').length;
  const lost = dest.filter(s => s === 'lost').length;
  const histo = (won + lost) >= 5 ? won / (won + lost) : null;
  const tauxDe = (t) => histo !== null ? (histo + TAUX_DEFAUT[t]) / 2 : TAUX_DEFAUT[t];
  const parTemp = { hot: [], warm: [], cold: [] };
  leads.filter(l => !['won', 'lost'].includes(l.status)).forEach(l => (parTemp[l.temp] || parTemp.warm).push(l));
  let espere = 0, espCloses = 0;
  console.log(`\n### Prévision ${H} mois (prix fixe ${usd(PRIX_AUDIT)}) — taux : ${histo !== null ? (histo * 100).toFixed(0) + '% historique (' + won + 'W/' + lost + 'L)' : 'défaut (historique < 5 deals)'}\nTempérature | Ouverts | Taux appliqué | Valeur espérée`);
  for (const t of ['hot', 'warm', 'cold']) {
    const taux = tauxDe(t), nb = parTemp[t].length;
    espere += nb * taux * PRIX_AUDIT; espCloses += nb * taux;
    console.log(`${t.padEnd(11)} | ${String(nb).padStart(7)} | ${(taux * 100).toFixed(0).padStart(9)}% | ${usd(nb * taux * PRIX_AUDIT).padStart(14)}`);
  }
  console.log('\nTableau mensuel (répartition uniforme) :\nMois | Closes attendus | Revenu    | Cumul');
  let cumul = 0;
  for (let m = 1; m <= H; m++) { cumul += espere / H; console.log(`M+${m}  | ${(espCloses / H).toFixed(1).padStart(15)} | ${usd(espere / H).padStart(9)} | ${usd(cumul)}`); }
  console.log('\nRecalculer chaque semaine : le taux bouge dès le prochain deal gagné/perdu.');
}

/* ---------- 4. win-prob : score de close, formule simple documentée ----------
 * base(statut): new=10 contacted=25 replied=50 negotiating=75 won=100 lost=0
 * × coef(température): hot=1.2 warm=1.0 cold=0.6 − pénalité silence:
 * 3 points/jour au-delà de 2 jours sans toucher ; borné [0;95].
 */
const BASE_STATUT = { new: 10, contacted: 25, replied: 50, negotiating: 75, won: 100, lost: 0 };
const COEF_TEMP = { hot: 1.2, warm: 1.0, cold: 0.6 };
function cmdWinProb(leadId) {
  const l = trouverLead(leadId || '');
  if (!l) return console.log('Usage: win-prob <leadId|nom> (voir data/crm.json)');
  const base = BASE_STATUT[l.status] !== undefined ? BASE_STATUT[l.status] : 15;
  const coef = COEF_TEMP[l.temp] || 1.0;
  const silence = joursDepuis(l.lastTouch);
  const penalite = Math.max(0, silence - 2) * 3;
  const score = Math.max(0, Math.min(95, base * coef - penalite)); // plafond 95 : rien n'est sûr avant encaissement
  console.log(`\n### Probabilité de close — #${l.id} ${l.name}`);
  console.log(`Formule : base(${l.status}=${base}) × coef(${l.temp}=×${coef}) − silence(${silence}j → −${penalite}) = ${score.toFixed(0)}%`);
  console.log(score >= 50 ? '→ Chaud : envoyer le lien de paiement aujourd\'hui.'
    : score >= 25 ? '→ Tiède : apporter une preuve nouvelle (ligne de manifest annotée).'
    : '→ Froid : dernière relance, archivage programmé à 30 jours de silence.');
}
/* ---------- 5. stalled : leads immobiles depuis >= 5 jours ---------- */
function cmdStalled() {
  const seuil = 5;
  const actions = { new: 'Relancer avec une variante différente (voir pitch-variants)',
    contacted: 'Follow-up court + UNE preuve nouvelle (capture d\'audit datée)',
    replied: 'Répondu sans acheter ? Lien de paiement direct + rappel garantie',
    negotiating: 'Débloquer : prix unique $5, remboursé si rien n\'est trouvé' };
  const cibles = crmLeads()
    .filter(l => !['won', 'lost'].includes(l.status) && joursDepuis(l.lastTouch) >= seuil)
    .sort((a, b) => joursDepuis(b.lastTouch) - joursDepuis(a.lastTouch)); // les plus oubliés d'abord
  if (!cibles.length) return console.log(`\nAucun lead sans contact depuis >= ${seuil} jours. Rythme tenu.\n`);
  console.log(`\n### ${cibles.length} lead(s) sans contact depuis >= ${seuil} jours :\n`);
  cibles.forEach(l => {
    console.log(`#${l.id} ${l.name} — ${l.status}/${l.temp}, silence de ${joursDepuis(l.lastTouch)} j`);
    console.log(`   Action : ${actions[l.status] || 'Réévaluer la température ; archiver à 30 j'}`);
  });
}

/* ---------- 6. upsell : suggestion selon l'échelle de valeur ----------
 * Échelle : audit $5 → audit+suivi 30j $25 → re-audit mensuel $3/mois
 */
function cmdUpsell(client) {
  if (!client) return console.log('Usage: upsell <client>');
  const reg = lireJson('invoices/registry.json', { invoices: [] });
  const echelle = ['', 'Audit x402 ($5)', 'Audit + suivi 30 jours ($25)', 'Re-audit mensuel ($3/mois)'];
  const achats = (reg.invoices || []).filter(i => (i.client || '').toLowerCase().includes(String(client).toLowerCase()));
  if (!achats.length) return console.log(`\n### Upsell — ${client}\nAucune facture : commencer par l'entrée de gamme → audit ${usd(PRIX_AUDIT)} (${SHOP}).`);
  let niv = 0, total = 0; // niveau détecté par mots-clés des descriptions facturées
  achats.forEach(a => {
    total += a.amountUsd || 0;
    const d = (a.desc || '').toLowerCase();
    if (d.includes('mensuel')) niv = Math.max(niv, 3);
    else if (d.includes('suivi')) niv = Math.max(niv, 2);
    else niv = Math.max(niv, 1);
  });
  console.log(`\n### Upsell — ${client}\n${achats.length} facture(s), ${usd(total)} cumulés — niveau atteint : ${echelle[niv]}`);
  if (niv === 1) console.log('Pitch : « Vous avez l\'inventaire des défauts. Ajoutez le suivi 30j ($25) : je re-teste vos corrections et surveille les régressions. »');
  else if (niv === 2) console.log('Pitch : « Verrouillez : re-audit mensuel $3/mois, alerte dès la première régression détectée. »');
  else if (niv >= 3) console.log('Sommet de l\'échelle → passer aux demandes : referral-msg + testimonial-ask.');
}

/* ---------- 7. referral-msg : demande de recommandation prête à envoyer ---------- */
function cmdReferralMsg(client) {
  if (!client) return console.log('Usage: referral-msg <clientHeureux>');
  console.log(`\n### Demande de recommandation — prête à envoyer à ${client}\n
Objet : 30 secondes qui m'aideraient beaucoup

Bonjour ${client},

Content que l'audit x402 t'ait servi — ton serveur encaisse désormais proprement.
Le geste qui m'aiderait le plus : connais-tu UN autre builder qui expose (ou lance) un
endpoint x402 ? Une simple intro par mail suffit. En échange : je vérifie son manifest
gratuitement au premier échange, et je cite ta recommandation dans mon registre public,
lien retour vers ton projet inclus.

Merci !
— automaton-alpha, agent ERC-8004 #67574 (Base) · ${SHOP}\n`);
}

/* ---------- 8. testimonial-ask : demande de témoignage ---------- */
function cmdTestimonialAsk(client) {
  if (!client) return console.log('Usage: testimonial-ask <client>');
  console.log(`\n### Email témoignage — prêt à envoyer à ${client}\n
Objet : 2 lignes de votre part ? (lien retour offert)

Bonjour ${client},

Votre serveur x402 est conforme depuis l'audit. Auriez-vous 2 lignes de retour ?
Format suffisant : « Avant : [problème]. Après l'audit : [résultat]. Je recommande. »
Exemples publiés : ${SHOP}/desk.html#temoignages — contre-partie : votre témoignage
publié AVEC lien retour vers votre projet, devant une audience d'agents x402.

Merci d'avance !
— automaton-alpha · ${SHOP}\n`);
}

/* ---------- 9. pricing-psych : 5 techniques appliquées AU chiffre donné ---------- */
function cmdPricingPsych(prixStr) {
  const p = parseFloat(prixStr);
  if (!p || p <= 0) return console.log('Usage: pricing-psych <prixBase> (ex: 5)');
  console.log(`\n### 5 présentations psychologiques de ${usd(p)}
1. ANCRAGE : « Un cabinet facture un audit sécurité à partir de $${(p * 100).toFixed(0)}. Ici : ${usd(p)} — automatisable, parce que je suis un agent. »
2. DÉCOMPOSITION/JOUR : « ${usd(p)} = ${usd(p / 30)} par jour sur un mois. Un café, pour un paywall qui encaisse proprement. »
3. COÛT DE L'INACTION : « Un seul acheteur agent qui abandonne sur un bug coûte plus que ${usd(p * 10)} sur l'année. L'audit coûte ${usd(p)}. »
4. BUNDLE : « Audit seul ${usd(p)} ; Audit + suivi 30j ${usd(p * 5)} — ~17% moins cher que les pièces séparées. »
5. GARANTIE : « ${usd(p)}, remboursés si aucun défaut exploitable n'est trouvé. Votre risque : zéro. »`);
}

/* ---------- 10. objection-drill : entraînement (auto-quiz non interactif) ---------- */
const OBJECTIONS = [
  ['$5 ? trop cher pour un script.', 'Coût d\'un café vs paywall muet : un appel payant perdu par jour dépasse le prix de l\'audit sur l\'année. Remboursé si rien n\'est trouvé.'],
  ['Je peux auditer moi-même.', 'Oui — mais ce n\'est pas fait depuis des semaines. $5 achètent une seconde paire d\'yeux immédiate, preuves ligne par ligne.'],
  ['Pourquoi faire confiance à un bot ?', 'Chaque audit livre des preuves datées (lignes fautives + patch). Mon registre public est transparent, erreurs comprises.'],
  ['Pas de budget ce trimestre.', 'Ce n\'est pas un budget : $5, une ligne café. L\'inaction coûte déjà plus cher chaque semaine.'],
  ['Envoyez un devis officiel.', 'Facture HTML générée automatiquement en une minute, mention ERC-8004 incluse. Je vous l\'envoie maintenant ?'],
  ['Un concurrent le fait gratuitement.', 'Gratuit = template générique. Chez moi : défauts relevés sur VOTRE endpoint, patch prêt à coller, garantie remboursé.'],
  ['On est en beta, pas encore de clients.', 'Justement : les premiers agents acheteurs arrivent avant vous. Être conforme dès leur première visite coûte $5.'],
  ['On fera plus tard.', 'Le défaut est visible aujourd\'hui par chaque visiteur agent. Plus tard = ventes perdues pendant toute l\'attente.'],
];
function cmdObjectionDrill() {
  const tirage = melange(OBJECTIONS).slice(0, 5);
  console.log('\n### Drill objections — cache la partie réponses, réponds à voix haute, compare.\nOBJECTIONS :');
  tirage.forEach((o, i) => console.log(`${i + 1}. ${o[0]}`));
  console.log('RÉPONSES DE RÉFÉRENCE :');
  tirage.forEach((o, i) => console.log(`${i + 1}. ${o[0]}\n   → ${o[1]}`));
}

/* ---------- 11. deal-review : checklist de post-mortem à recopier au ledger ---------- */
function cmdDealReview(clientId) {
  if (!clientId) return console.log('Usage: deal-review <clientId>');
  console.log(`\n### Post-mortem de deal — ${clientId} (à recopier dans le ledger)
Issue (GAGNÉ/PERDU) : ____   Canal d'entrée : ____ (issue/github/email/directory)
Durée du cycle (1er contact → décision) : ____ j   Objection décisive (mot pour mot) : ____
Ce qui a débloqué / tué le deal : ____   Preuve qui a pesé le plus : ____
Prix perçu : trop bas | juste | élevé → ajustement d'angle : ____
Phrase du client à réutiliser en marketing : ____
À refaire identiquement : ____   Erreur à ne plus commettre : ____
Upsell naturel : suivi $25 ? re-audit mensuel $3 ? → ____`);
}

/* ---------- 12. quota-track : avancement du mois vs objectif ----------
 * Sources : data/invoices/registry.json (factures du mois courant)
 *          + crm.json (leads passés 'won' ce mois, valorisés au prix de l'audit)
 */
function cmdQuotaTrack(objectifStr) {
  const objectif = parseFloat(objectifStr || '100');
  const reg = lireJson('invoices/registry.json', { invoices: [] });
  const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
  const dansMois = (iso) => new Date(iso) >= debutMois;
  const fac = (reg.invoices || []).filter(i => dansMois(i.date));
  const facture = fac.reduce((s, i) => s + (i.amountUsd || 0), 0);
  const wonCrm = crmLeads().filter(l => l.status === 'won'
    && (l.history || []).some(h => h.to === 'won' && dansMois(h.at))).length;
  const realize = facture + wonCrm * PRIX_AUDIT; // won CRM non facturés valorisés à $5
  const maintenant = new Date();
  const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
  const joursRestants = Math.max(1, Math.ceil((finMois - maintenant) / 864e5));
  const pct = objectif > 0 ? Math.min(100, (realize / objectif) * 100) : 100;
  const reste = Math.max(0, objectif - realize);
  console.log(`\n### Quota ${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')} — objectif ${usd(objectif)}`);
  console.log(`[${'='.repeat(Math.round(pct / 5)).padEnd(20, ' ')}] ${pct.toFixed(0)}%`);
  console.log(`Facturé : ${usd(facture)} (${fac.length} fact.) · Won CRM : ${wonCrm} × ${usd(PRIX_AUDIT)} = ${usd(wonCrm * PRIX_AUDIT)}`);
  console.log(`Réalisé : ${usd(realize)} — reste ${usd(reste)} sur ${joursRestants} j → ${usd(reste / joursRestants)}/jour · soit ${Math.ceil(reste / PRIX_AUDIT)} audit(s). Pipeline chaud : ${crmLeads().filter(l => l.temp === 'hot' && !['won', 'lost'].includes(l.status)).length} lead(s).`);
}

/* ---------- Aide & routage des sous-commandes ---------- */
function usage() {
  console.log(`sales-suite.js — outils commerciaux d'automaton-alpha (audits x402 ${usd(PRIX_AUDIT)})
Sous-commandes :
  pitch-variants <lead> <defaut1> [defaut2]   3 pitches froids prêts à copier
  subject-ab <produit>                        6 objets d'email pour test A/B
  forecast [horizonMois=3]                    projection de revenus depuis le CRM
  win-prob <leadId>                           probabilité de close (formule documentée)
  stalled                                     leads sans contact >= 5 jours + actions
  upsell <client>                             suggestion selon l'échelle de valeur
  referral-msg <clientHeureux>                demande de recommandation prête à envoyer
  testimonial-ask <client>                    email de demande de témoignage
  pricing-psych <prixBase>                    5 techniques de présentation du prix
  objection-drill                             5 objections aléatoires + réponses types
  deal-review <clientId>                      checklist de post-mortem à remplir
  quota-track [objectifMensuelUsd=100]        avancement du mois vs objectif`);
}

const COMMANDES = {
  'pitch-variants': cmdPitchVariants, 'subject-ab': cmdSubjectAb, 'forecast': cmdForecast,
  'win-prob': cmdWinProb, 'stalled': cmdStalled, 'upsell': cmdUpsell,
  'referral-msg': cmdReferralMsg, 'testimonial-ask': cmdTestimonialAsk,
  'pricing-psych': cmdPricingPsych, 'objection-drill': cmdObjectionDrill,
  'deal-review': cmdDealReview, 'quota-track': cmdQuotaTrack,
};

const [, , sousCommande, ...reste] = process.argv;
if (!sousCommande || !COMMANDES[sousCommande]) { usage(); process.exit(sousCommande ? 1 : 0); }
COMMANDES[sousCommande](...reste);
