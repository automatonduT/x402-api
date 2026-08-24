#!/usr/bin/env node
/* =========================================================================
 * content-suite.js — Boîte à outils contenu d'automaton-alpha
 * Agent ERC-8004 #67574 (Base) — audits x402 à $5 · https://skintight-snowcap-underarm.ngrok-free.dev
 * Sources réelles : experiments.md, data/content-plan.json, data/leads-classified.json,
 * billets publiés dans x402-api/public/. Zéro dépendance externe.
 * Usage : node content-suite.js <sous-commande> [args]
 * ========================================================================= */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(os.homedir(), 'automaton-work');
const DATA = path.join(ROOT, 'data');
const PUBLIC = path.join(ROOT, 'x402-api', 'public'); // billets publiés
const SHOP = 'https://skintight-snowcap-underarm.ngrok-free.dev';

const lire = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return null; } };
const lireJson = (f, defaut) => {
  const t = lire(f);
  if (t === null) return defaut;
  try { return JSON.parse(t); } catch (e) { return defaut; }
};
// décode les entités HTML courantes (accents inclus) au lieu de les perdre
const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', ucirc: 'û',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…',
  laquo: '«', raquo: '»', deg: '°', euro: '€' };
// retire balises/scripts pour analyser du texte brut
const enTexte = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, g) => {
    if (g[0] === '#') { // entité numérique : &#233; ou &#xE9;
      const n = /^#x/i.test(g) ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ' ';
    }
    const v = ENTITES[g.toLowerCase()];
    return v === undefined ? ' ' : v;
  })
  .replace(/\s+/g, ' ').trim();

/* ---------- ideas [n=8] : angles concrets tirés des données réelles ---------- */
function cmdIdeas(nStr) {
  const n = Math.max(1, parseInt(nStr || '8', 10) || 8);
  const idees = [];
  // Source 1 : registre d'expériences — chaque ligne datée devient un angle précis
  for (const ligne of ((lire(path.join(ROOT, 'experiments.md')) || '').split('\n'))) {
    if (!ligne.startsWith('|')) continue;
    const c = ligne.split('|').map(x => x.trim());
    if (!c[3] || c[3] === 'Experiment' || /^-+$/.test(c[1]) || c[1] === '#') continue;
    const exp = c[3].slice(0, 90);
    if (/^(stats|snapshot)|^auto$/i.test(c[1]) || /^stats/i.test(exp)) continue; // bruit technique
    if (/FIX/i.test(c[1])) idees.push(`« J'ai cassé ${exp.replace(/^v[\d.]+\s*:\s*/i, '')} » — post-mortem du fix, diff exact à l'appui.`);
    else if (/PLAN|EXP#\d/i.test(c[1])) idees.push(`Expérience pré-enregistrée : ${exp} — hypothèse et seuil de succès annoncés AVANT, verdict honnête après.`);
    else if (/DOWN|FALSE|stale|morte|dead|bug|404/i.test(ligne)) idees.push(`Panne racontée : ${exp} — détection, diagnostic, garde-fou ajouté depuis.`);
    else if (c[6] && !/^(shipped|done|planned|-)$/i.test(c[6])) idees.push(`Sous le capot : ${exp} — verdict réel : ${c[6].slice(0, 60)}.`);
  }
  // Source 2 : défauts x402 classifiés — statistique concrète sur les serveurs audités
  const cls = lireJson(path.join(DATA, 'leads-classified.json'), []);
  if (Array.isArray(cls) && cls.length) {
    const defauts = {};
    cls.forEach(x => (x.defects || []).forEach(d => { defauts[d] = (defauts[d] || 0) + 1; }));
    Object.entries(defauts).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .forEach(([d, k]) => idees.push(`${k} serveurs x402 sur ${cls.length} ont « ${d} » — capture + correctif de manifest en 5 lignes.`));
    idees.push(`Autopsie du scan awesome-x402 : ${cls.length} cibles classées, quels canaux de contact répondent vraiment.`);
  }
  if (!idees.length) return console.log('\nPas encore de données : remplis experiments.md ou data/leads-classified.json.');
  console.log(`\n### ${Math.min(n, idees.length)} idées de billets (sur ${idees.length}, toutes issues du workspace) :\n`);
  idees.slice(0, n).forEach((i, k) => console.log(`${k + 1}. ${i}`));
}

/* ---------- headline-score <titre> : note /8 + conseils + 2 variantes ---------- */
function cmdHeadlineScore(titre) {
  if (!titre) return console.log('Usage: headline-score "<titre>"');
  const checks = [
    ['chiffre', /\d/.test(titre), 'ajoute un nombre concret (coût, délai, comptage)'],
    ['curiosité', /(pourquoi|comment|secret|erreur|personne|jamais|v[eé]rit[eé]|cass[eé])/i.test(titre), 'ouvre une boucle : pourquoi, erreur, personne ne…'],
    ['spécificité', /(x402|usdc|base|erc|\$|%|agent|manifest)/i.test(titre), 'nomme le domaine (x402, USDC, manifest…) plutôt qu\'un mot vague'],
  ];
  const L = titre.trim().length;
  const longueurOk = L >= 30 && L <= 65;
  console.log(`\n### Score : ${checks.filter(c => c[1]).length * 2 + (longueurOk ? 2 : 0)}/8 — « ${titre} »`);
  checks.forEach(([nom, ok, conseil]) => console.log(` [${ok ? 'x' : ' '}] ${nom.padEnd(11)} ${ok ? 'ok' : '→ ' + conseil}`));
  console.log(` [${longueurOk ? 'x' : ' '}] longueur    ${L} caractères (idéal 30–65)${longueurOk ? '' : ' → raccourcir ou étoffer'}`);
  const base = titre.replace(/[:;.!?]+$/, '');
  const v1 = /\d/.test(base) ? `${base} — données datées, vérifiables` : `3 leçons : ${base}`;
  const v2 = /^(pourquoi|comment)/i.test(base)
    ? `La vérité sur ${base.replace(/^(pourquoi|comment)\s+/i, '')}`
    : `Pourquoi ${base.charAt(0).toLowerCase() + base.slice(1)} (et ce que j'ai changé le lendemain)`;
  console.log(`\nVariantes :\n 1. ${v1}\n 2. ${v2}`);
}

/* ---------- outline <sujet> : plan 7 blocs pré-rempli de questions ---------- */
function cmdOutline(sujet) {
  if (!sujet) return console.log('Usage: outline "<sujet>"');
  const blocs = [
    ['1. HOOK (2 phrases)', ['Quel fait choquant ou chiffré ouvre le billet ?', 'En 5 secondes, on sait de quoi il est question ?']],
    ['2. CONTEXTE', ['Décor exact : serveur, date, stack ?', 'Pourquoi MAINTENANT — quel déclencheur réel ?']],
    ['3. PROBLÈME', ['Symptôme précis : message d\'erreur, mesure ?', 'Qui perd quoi tant que ça dure ?']],
    ['4. CŒUR (le comment)', ['Étapes du diagnostic dans l\'ordre vrai ?', 'Code/config minimale reproductible fournie ?']],
    ['5. PREUVES', ['Logs, captures, avant/après chiffrés ?', 'Contre-preuve : ce qui aurait pu marcher autrement ?']],
    ['6. LEÇON', ['La règle générale en UNE phrase citable ?', 'Les limites honnêtes de cette leçon ?']],
    ['7. CTA', ['Une seule action : inspecteur gratuit, audit $5 ou abonnement ?', 'Lien tracké ?ref=blog présent ?']],
  ];
  console.log(`\n### Plan 7 blocs — « ${sujet} »`);
  blocs.forEach(([t, qs]) => { console.log('\n' + t); qs.forEach(q => console.log('   - [ ] ' + q)); });
  console.log('\nRègle : toutes les cases remplies avant la première phrase du billet.');
}

/* ---------- repurpose <fichierBlog> [format=threads] ---------- */
function cmdRepurpose(fichier, format) {
  if (!fichier) return console.log('Usage: repurpose <fichierBlog.html|.md> [format=threads]');
  const brut = lire(path.resolve(fichier));
  if (brut === null) return console.log('Fichier introuvable : ' + fichier);
  const mTitre = brut.match(/<title>([^<]*)<\/title>/i) || brut.match(/<h1[^>]*>([^<]*)<\/h1>/i) || brut.match(/^#\s+(.+)$/m);
  const titre = (mTitre ? mTitre[1] : path.basename(fichier)).trim();
  // en markdown : écarter lignes de code/tableaux avant extraction des phrases
  const corps = /\.md$/i.test(fichier)
    ? brut.split('\n').filter(l => !/^\s*(\||```|#)/.test(l)).join('\n') : brut;
  // phrases exploitables puis score d'intérêt : chiffres, dollars/produit, première personne
  // on écarte le bruit : méta (SIMULATION/dates seules) et phrases recollant le titre/nav
  const phrases = enTexte(corps).split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 40 && s.length < 240)
    .filter(s => !/SIMULATION ONLY|^\d{4}-\d{2}-\d{2}/.test(s))
    .filter(s => !(titre.length > 18 && s.slice(0, titre.length + 5).includes(titre)));
  const interet = (s) => (/\d/.test(s) ? 2 : 0) + (/\$|USDC|x402/i.test(s) ? 2 : 0) + (/j['’]ai|mon |ma /.test(s) ? 1 : 0);
  const top = phrases.slice().sort((a, b) => interet(b) - interet(a)).slice(0, 9);
  const dernier = Math.min(10, top.slice(0, 8).length + 2);
  const thread = [`1/ ${titre} — fil 🧵`]
    .concat(top.slice(0, 8).map((s, i) => `${i + 2}/ ${s}`))
    .concat([`${dernier}/ Un doute sur votre paywall x402 ? Audit complet $5, remboursé si rien n'est trouvé → ${SHOP}`]);
  if (format !== 'newsletter') {
    console.log(`\n### THREAD X (${Math.min(10, thread.length)} tweets max) — extrait de « ${titre} »\n`);
    thread.slice(0, 10).forEach(t => console.log(t + '\n'));
  }
  if (format !== 'threads') { // version newsletter courte
    console.log(`### NEWSLETTER COURTE\nSujet : ${titre}\n\nBonjour,\n\n${top[0] || ''}\n\n${top[1] || ''}\n\n${top[2] || ''}\n\nAller plus loin : audit x402 à $5 → ${SHOP}\n— automaton-alpha (ERC-8004 #67574)\n`);
  }
}

/* ---------- cta-library : 12 CTA par objectif ---------- */
const CTAS = [
  ['gratuit → email', '« Le prochain épisode arrive par mail — laisse ton adresse »', 'pied d\'un billet narratif que le lecteur vient de finir'],
  ['gratuit → email', '« Les coulisses brutes chaque semaine : abonne-toi au digest »', 'après un post-mortem honnête (confiance établie)'],
  ['gratuit → email', '« Veille x402 hebdo, zéro spam, désinscription 1 clic »', 'pages evergreen à fort trafic'],
  ['inspecteur', '« Colle ton manifest dans l\'inspecteur gratuit : verdict en 5 s »', 'billets techniques sur les défauts de manifest'],
  ['inspecteur', '« Teste TON endpoint avant qu\'un agent le teste »', 'articles découverte/paiement x402'],
  ['inspecteur', '« Diagnostic gratuit ici ; correction guidée dans l\'audit »', 'quand l\'outil gratuit révèle un problème'],
  ['audit $5', `« Audit complet \$5, remboursé si rien n'est trouvé → ${SHOP} »`, 'partout où un défaut vient d\'être démontré'],
  ['audit $5', '« Un café le prix, un rapport ligne par ligne le rendu »', 'audience builders pressés'],
  ['audit $5', '« Avant ta première vraie vente agent : fais auditer le paywall ($5) »', 'prospects en phase de lancement'],
  ['abonnement', '« Re-audit mensuel $3 : une régression détectée, tu es alerté »', 'clients déjà audités (upsell niveau 3)'],
  ['abonnement', '« La conformité x402 n\'est pas un one-shot : $3/mois pour dormir tranquille »', 'après un fix qui a cassé puis recassé'],
  ['abonnement', '« Ton serveur bouge, le standard bouge : suivi continu $3/mois »', 'équipes qui déploient souvent'],
];
function cmdCtaLibrary() {
  console.log('\n### Bibliothèque de 12 CTA, classés par objectif\n');
  CTAS.forEach((c, i) => console.log(`${String(i + 1).padStart(2)}. [${c[0]}] ${c[1]}\n     Quand : ${c[2]}`));
}

/* ---------- hook-library : 15 formules avec exemple du domaine ---------- */
const HOOKS = [
  ['chiffre choc', '« 1048 pages crawlées sur x402scan. Zéro canal de soumission trouvé. »'],
  ['chiffre choc', '« 3 serveurs x402 sur 4 refusent silencieusement l\'argent des agents. »'],
  ['contre-intuitif', '« Plus ton paywall est strict, moins tu vends. Voici la preuve par les logs. »'],
  ['contre-intuitif', '« Le meilleur moment pour vendre aux agents, c\'est avant qu\'ils puissent payer. »'],
  ['confession', '« J\'ai fait payer des agents sur un tunnel mort pendant 48 h. Post-mortem. »'],
  ['confession', '« Mon détecteur d\'inbound m\'a menti pendant 2 jours. Faux positif expliqué. »'],
  ['avant/après', '« Avant : 402 sans corps. Après : message machine-lisible + vente. Même serveur. »'],
  ['question gênante', '« Si un agent voulait t\'acheter quelque chose aujourd\'hui… y arriverait-il ? »'],
  ['histoire minute par minute', '« 22:06, mon compteur grimpe tout seul. 22:09, je découvre que c\'est moi. »'],
  ['promesse mesurable', '« En 10 minutes, tu sauras si ton manifest x402 perd des ventes. Gratuit. »'],
  ['ennemi nommé', '« Ce champ absent du manifest coûte des ventes à tout le standard x402. »'],
  ['liste brute', '« Les 7 défauts que je vois sur presque tous les serveurs x402. »'],
  ['verdict tranché', '« Ce répertoire est mort. J\'ai les dates pour le prouver. »'],
  ['citation retournée', '« Build it and they will pay — non. Build it RIGHT and they will pay. »'],
  ['chiffre personnel', '« $5. C\'est tout ce que coûte de savoir si ton paywall fonctionne vraiment. »'],
];
function cmdHookLibrary() {
  console.log('\n### 15 formules de hooks, exemples remplis domaine x402/agents\n');
  HOOKS.forEach((h, i) => console.log(`${String(i + 1).padStart(2)}. [${h[0]}] ${h[1]}`));
}

/* ---------- calendar [semaines=4] : 1 billet/semaine selon content-plan.json ---------- */
function cmdCalendar(semainesStr) {
  const W = Math.max(1, parseInt(semainesStr || '4', 10) || 4);
  const plan = lireJson(path.join(DATA, 'content-plan.json'), { items: [] });
  const file = (plan.items || []).filter(i => i.status !== 'published'); // backlog dans l'ordre créé
  console.log(`\n### Calendrier réaliste — 1 billet/semaine × ${W}`);
  for (let w = 1; w <= W; w++) {
    const item = file[w - 1];
    console.log(item
      ? `Semaine ${w} : « ${item.title} » (angle : ${item.angle || 'à préciser'}) — statut actuel : ${item.status}`
      : `Semaine ${w} : backlog épuisé → piocher via \`ideas\` puis ajouter à content-plan.json`);
  }
  console.log('\nRythme assumé : 4 billets tenus > 10 promis. Après CHAQUE publication → distribution-checklist.');
}

/* ---------- distribution-checklist <titre> ---------- */
function cmdDistributionChecklist(titre) {
  if (!titre) return console.log('Usage: distribution-checklist "<titre>"');
  const taches = [
    'IndexNow : pinger api.indexnow.org avec la clé du site (URL du billet en payload)',
    'RSS : vérifier que le flux contient le nouvel <item> (titre + date + lien)',
    'desk.html : carte du billet ajoutée en tête (titre, lien, date)',
    'llms-full.txt : résumé 3 lignes + URL ajoutés (les agents lisent ça)',
    'awesome-x402 : PR seulement si mérite réel (données inédites OU outil réutilisable)',
    'Attribution : tous les liens internes portent ?ref=blog (mesurable via /refs)',
    'Mesure : baseline visitor-analytics maintenant, comparaison à 48 h',
    'Repurpose : lancer `repurpose <fichier>` → thread X + newsletter courte',
  ];
  console.log(`\n### Checklist post-publication — « ${titre} »\n`);
  taches.forEach(t => console.log('[ ] ' + t));
}

/* ---------- readability <fichier> : longueur phrases, jargon, score simplicité ---------- */
const JARGON = ['paywall', 'endpoint', 'manifest', 'oracle', 'settlement', 'webhook', 'idempot',
  'schema', 'rate limit', 'json-rpc', 'usdc', 'x402', 'erc-8004', 'cron', 'regex', 'payload', 'proxy'];
function cmdReadability(fichier) {
  const brut = lire(path.resolve(fichier));
  if (brut === null) return console.log('Fichier introuvable : ' + fichier);
  const texte = /\.html?$/i.test(fichier) ? enTexte(brut) : brut.replace(/\s+/g, ' ').trim();
  const mots = texte.split(' ').filter(Boolean);
  const phrases = texte.split(/[.!?]+\s/).filter(p => p.split(' ').length > 2);
  const moy = mots.length / Math.max(1, phrases.length);
  const longues = phrases.filter(p => p.split(' ').length > 25);
  const bas = texte.toLowerCase();
  const jargonTrouve = [...new Set(JARGON.filter(j => bas.includes(j)))];
  const penalites = longues.length * 3 + jargonTrouve.length * 2 + Math.max(0, moy - 20);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalites)));
  console.log(`\n### Lisibilité — ${path.basename(fichier)}`);
  console.log(`Mots : ${mots.length} · Phrases : ${phrases.length} · Moyenne : ${moy.toFixed(1)} mots/phrase (cible <= 20)`);
  console.log(`Phrases > 25 mots : ${longues.length}${longues.length ? ' — ex. « ' + longues.sort((a, b) => b.length - a.length)[0].split(' ').slice(0, 12).join(' ') + '… »' : ''}`);
  console.log(`Jargon (${jargonTrouve.length}) : ${jargonTrouve.join(', ') || 'aucun'}`);
  console.log(`Score simplicité : ${score}/100 — ${score >= 75 ? 'fluide, garder ce niveau'
    : score >= 50 ? 'correct : couper les longues phrases, définir le jargon à sa 1re occurrence'
    : 'dense : découper, raccourcir, vulgariser'}`);
}

/* ---------- evergreen-check : billets à rafraîchir (> 60 j ou URL morte) ---------- */
function cmdEvergreenCheck() {
  let fichiers = [];
  try {
    fichiers = fs.readdirSync(PUBLIC).filter(f => /^(blog-|episode-\d)/.test(f) && f.endsWith('.html'));
  } catch (e) { /* dossier absent -> liste vide */ }
  if (!fichiers.length) return console.log('Aucun billet trouvé dans ' + PUBLIC);
  console.log(`\n### Billets candidats à une mise à jour (> 60 jours ou URL périmée)\n`);
  let alertes = 0;
  fichiers.forEach(f => {
    const age = Math.floor((Date.now() - fs.statSync(path.join(PUBLIC, f)).mtimeMs) / 864e5);
    const vieuxLien = /trycloudflare|localhost:4020/.test(lire(path.join(PUBLIC, f)) || ''); // tunnels antérieurs
    if (age > 60 || vieuxLien) {
      alertes++;
      console.log(`[!] ${f} (${age} j)${age > 60 ? ' — âge > 60 j : revérifier liens, prix, stats citées' : ''}${vieuxLien ? ` — URL de tunnel morte détectée → remplacer par ${SHOP}` : ''}`);
    } else console.log(`[ok] ${f} (${age} j) — frais, rien à faire`);
  });
  console.log(`\n${alertes} billet(s) à rafraîchir. Priorité à ceux dont le CTA pointe vers la boutique.`);
}

/* ---------- Aide & routage des sous-commandes ---------- */
function usage() {
  console.log(`content-suite.js — outils contenu d'automaton-alpha
Sous-commandes :
  ideas [n=8]                    idées de billets tirées des données réelles
  headline-score "<titre>"       score de titre /8 + conseils + 2 variantes
  outline "<sujet>"              plan 7 blocs pré-rempli de questions
  repurpose <fichierBlog> [fmt]  thread X (10 max) + newsletter courte
  cta-library                    12 CTA classés par objectif
  hook-library                   15 formules de hooks avec exemples
  calendar [semaines=4]          plan 1 billet/semaine depuis content-plan.json
  distribution-checklist "<t>"   checklist complète après publication
  readability <fichier>          longueur phrases, jargon, score simplicité
  evergreen-check                billets publics à rafraîchir (> 60 j / URL morte)`);
}

const COMMANDES = {
  'ideas': cmdIdeas, 'headline-score': cmdHeadlineScore, 'outline': cmdOutline,
  'repurpose': cmdRepurpose, 'cta-library': cmdCtaLibrary, 'hook-library': cmdHookLibrary,
  'calendar': cmdCalendar, 'distribution-checklist': cmdDistributionChecklist,
  'readability': cmdReadability, 'evergreen-check': cmdEvergreenCheck,
};

const [, , sousCommande, ...reste] = process.argv;
if (!sousCommande || !COMMANDES[sousCommande]) { usage(); process.exit(sousCommande ? 1 : 0); }
COMMANDES[sousCommande](...reste);
