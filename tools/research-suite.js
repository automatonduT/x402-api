#!/usr/bin/env node
// ============================================================================
// research-suite.js — Recherche de marché pour automaton-alpha (boutique x402)
// Boutique : https://skintight-snowcap-underarm.ngrok-free.dev (audits x402 $5
// + outils marché). Chiffres réels via API GitHub/npm quand possible, sinon
// cadres structurés à remplir. Zéro dépendance externe (natifs Node).
// Usage : node research-suite.js <sous-commande> [argument]
// ============================================================================
'use strict';
const http = require('http'), https = require('https');
const SHOP_URL = 'https://skintight-snowcap-underarm.ngrok-free.dev';
const GH_API = 'https://api.github.com';
const UA = 'automaton-alpha/1.0 (research-suite)';

// GET http/https avec redirections ; renvoie toujours {status, body}, ne jette pas.
function fetchUrl(urlStr, timeoutMs) {
  const timeout = timeoutMs || 10000;
  return new Promise((resolve) => {
    const mod = urlStr.indexOf('https://') === 0 ? https : http;
    let req;
    try {
      req = mod.get(urlStr, { headers: { 'User-Agent': UA, Accept: '*/*', 'ngrok-skip-browser-warning': 'true' }, timeout }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          let next; try { next = new URL(res.headers.location, urlStr).toString(); } catch (e) { resolve({ status: res.statusCode }); return; }
          resolve(fetchUrl(next, timeout)); return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { body += c; if (body.length > 4e6) req.destroy(); });
        res.on('end', () => resolve({ status: res.statusCode || 0, body }));
      });
    } catch (e) { resolve({ status: 0, error: String(e && e.message ? e.message : e) }); return; }
    req.on('timeout', () => req.destroy(new Error('delai depasse')));
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
  });
}
// API GitHub non authentifiée (quota 60/h) ; renvoie {data} ou {error}.
async function ghApi(pathAndQuery) {
  const r = await fetchUrl(GH_API + pathAndQuery);
  if (r.status !== 200) {
    const hint = (r.status === 403 || r.status === 429) ? ' — quota GitHub probablement atteint' : '';
    return { error: 'HTTP ' + (r.status || r.error) + hint };
  }
  try { return { data: JSON.parse(r.body) }; } catch (e) { return { error: 'JSON invalide' }; }
}
// Recherche sur le registre npm (endpoint officiel).
async function npmSearch(term) {
  const r = await fetchUrl('https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(term) + '&size=5');
  if (r.status !== 200) return null;
  try { return JSON.parse(r.body); } catch (e) { return null; }
}
const daysAgoIso = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

// market-size : cadre rempli avec les chiffres réels accessibles (GitHub, npm).
async function cmdMarketSize(niche) {
  console.log('\n== MARKET-SIZE : ' + (niche || 'x402-tools') + ' ==');
  const gh = await ghApi('/search/repositories?q=x402&per_page=1');
  console.log('Repos GitHub « x402 »   : ' + (gh.data ? gh.data.total_count + ' (total_count API)' : 'indisponible (' + (gh.error || '?') + ')'));
  const npm = await npmSearch('x402');
  console.log('Paquets npm « x402 »    : ' + (npm ? npm.total + ' (total registre)' : 'indisponible'));
  // Vendeurs actifs ≈ repos non-fork poussés depuis 90 jours.
  const active = await ghApi('/search/repositories?q=' + encodeURIComponent('x402 pushed:>' + daysAgoIso(90)) + '&per_page=100');
  const vendors = active.data ? (active.data.items || []).filter((it) => !it.fork).length + ' observés / ' + active.data.total_count + ' candidats' : 'estimation impossible maintenant (réseau/quota)';
  console.log('Vendeurs actifs estimés : ' + vendors + ' (repos non-fork, push <90j)');
  console.log('\nCadre d’analyse :\n  • Marché adressable direct = devs intégrant x402 (repos actifs ci-dessus).\n  • Conversion prudente : 1–5 % achètent un audit $5 → revenu mensuel à modéliser.\n  • Recalculer chaque semaine : node research-suite.js market-size');
}
// competitor-pricing : tente d’extraire les $N de sa page pricing, sinon cadre manuel.
async function cmdCompetitorPricing(arg) {
  if (!arg) return console.log('Usage : competitor-pricing <nomOuUrl>');
  console.log('\n== COMPETITOR-PRICING : ' + arg + ' ==');
  let prices = [];
  if (/^https?:\/\//i.test(arg)) {
    const base = arg.replace(/\/+$/, '');
    for (const url of [base, base + '/pricing']) {
      const r = await fetchUrl(url, 8000);
      if (r.status === 200) {
        prices = Array.from(new Set(r.body.match(/\$\s?\d+(?:[.,]\d+)?/g) || []));
        console.log('Page analysée : ' + url + ' (' + prices.length + ' prix détectés)');
        break;
      }
    }
  } else {
    console.log('(nom fourni sans URL → relever les prix manuellement sur son site)');
  }
  console.log('\nPrix détectés automatiquement : ' + (prices.length ? prices.join(', ') : 'aucun'));
  console.log('\nCadre structuré à compléter :');
  ['Offre / plan', 'Prix', 'Unité (appel/mois/unique)', 'Cible (dev/agence/IA)', 'Moyen de paiement', 'Preuve sociale'].forEach((l) =>
    console.log('  [ ] ' + l.padEnd(26) + ': ____________'));
  console.log('\nRègle de veille : re-noter à chaque changement de leur page pricing.');
}
// trend-watch : repos créés <30j sur topic x402/mcp/ai-agents triés par étoiles.
async function cmdTrendWatch() {
  const since = daysAgoIso(30);
  console.log('\n== TREND-WATCH (créés depuis ' + since + ') ==');
  for (const topic of ['x402', 'mcp', 'ai-agents']) {
    const res = await ghApi('/search/repositories?q=' + encodeURIComponent('topic:' + topic + ' created:>' + since) + '&sort=stars&order=desc&per_page=5');
    console.log('\n# topic:' + topic);
    if (!res.data) { console.log('  indisponible : ' + (res.error || '?')); continue; }
    (res.data.items || []).forEach((it, i) => console.log('  ' + (i + 1) + '. ★' + it.stargazers_count + '  ' + it.full_name + ' — ' + String(it.description || '').slice(0, 70)));
  }
  console.log('\n→ Les étoiles montent là où va l’écosystème : se positionner sur le topic n°1.');
}
// audience-questions : issues ouvertes "how to"/"error" = idées contenu/produit.
async function cmdAudienceQuestions(source) {
  console.log('\n== AUDIENCE-QUESTIONS (source=' + (source || 'github') + ') ==');
  if (source && source !== 'github') console.log('(seule la source github est branchée actuellement)');
  const queries = ['x402 how to is:issue is:open', 'x402 error is:issue is:open', 'x402 "payment required" is:issue is:open'];
  let count = 0;
  for (const q of queries) {
    const res = await ghApi('/search/issues?q=' + encodeURIComponent(q) + '&sort=created&order=desc&per_page=5');
    console.log('\n# "' + q + '"');
    if (!res.data) { console.log('  indisponible : ' + (res.error || '?')); continue; }
    (res.data.items || []).forEach((it) => {
      count++;
      console.log('  [' + String(it.created_at || '').slice(0, 10) + '] ' + String(it.title || '').slice(0, 80) + '\n      ' + (it.html_url || ''));
    });
  }
  if (count) console.log('\n→ Chaque question récurrente = article FAQ ou micro-produit à lancer.');
}
// niche-gaps : croise awesome-x402 (capacités documentées) avec notre offre.
async function cmdNicheGaps() {
  console.log('\n== NICHE-GAPS ==');
  const r = await fetchUrl('https://raw.githubusercontent.com/xpaysh/awesome-x402/main/README.md');
  if (r.status !== 200) return console.log('README awesome-x402 inaccessible (HTTP ' + (r.status || r.error) + '). Relancer plus tard.');
  const sections = [];
  r.body.split('\n').forEach((line) => { // titres du README = capacités documentées
    const m = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (m && !/^table of contents$/i.test(m[1])) sections.push(m[1]);
  });
  const OFFER_KW = [['audit', 'security'], ['seo'], ['market', 'research'], ['pricing']];
  const gaps = sections.filter((s) => { const low = s.toLowerCase(); return !OFFER_KW.some((kws) => kws.some((k) => low.indexOf(k) !== -1)); });
  console.log('Capacités documentées (' + sections.length + ' sections README) :');
  sections.slice(0, 20).forEach((s) => console.log('  - ' + s));
  console.log('\nNotre offre actuelle : audit x402 $5 | seo-suite | research-suite | grille tarifaire');
  console.log('\nSections SANS équivalent chez nous (trous potentiels à combler) :');
  (gaps.length ? gaps.slice(0, 10) : ['(aucun trou évident dans les titres — creuser le détail des listes)']).forEach((g) => console.log('  → ' + g));
}
// swot : analyse SWOT pré-remplie pour un sujet + questions de validation.
function cmdSwot(subject) {
  console.log('\n== SWOT : ' + (subject || 'automaton-alpha') + ' ==');
  [
    ['FORCES (internes +)', ['Boutique ouverte 24/7 sans coût marginal', 'Audit x402 à $5 : prix d’essai sans friction', 'Outils internes déjà écrits (seo-suite, research-suite)', 'Paiement machine-à-machine natif (x402/USDC)']],
    ['FAIBLESSES (internes −)', ['Marque inconnue, zéro avis client accumulé', 'Tunnel dépendant d’un ngrok gratuit (instabilité)', 'Un seul opérateur : pas de redondance humaine']],
    ['OPPORTUNITÉS (externes +)', ['Écosystème x402 naissant, peu de vendeurs établis', 'Agents IA cherchent des audits pas chers automatisables', '« x402 audit » encore peu concurrent en SEO']],
    ['MENACES (externes −)', ['Un concurrent sérieux copie l’offre en une semaine', 'Changement de protocole x402 cassant l’audit', 'Plateformes (GitHub/ngrok) pouvant couper l’accès']]
  ].forEach(([titre, items]) => { console.log('\n[' + titre + ']'); items.forEach((it) => console.log('  • ' + it)); });
  console.log('\nQuestions à valider avant d’investir :\n  1. Chaque force est-elle prouvable par une capture/métrique datée ?\n  2. Chaque menace a-t-elle un plan B concret (domaine propre, backup statique) ?\n  3. L’opportunité n°1 a-t-elle eu un test de demande cette semaine ?');
}
// pricing-research : prix publics connus de l’écosystème → positionnement conseillé.
function cmdPricingResearch() {
  console.log('\n== PRICING-RESEARCH ==\nRéférences publiques connues (à revérifier régulièrement) :\n');
  [
    ['Appel API agent (micro-transactions)', '~$0.01 / appel', 'volume infini, valeur unitaire nulle'],
    ['Audit sécurité freelance entrée de gamme', '$50 – $150 / audit', 'humain, lent, non scalable'],
    ['Bounty bug smart contract public', '$25 – $500+', 'ponctuel et très compétitif'],
    ['Notre audit x402 automatisé', '$5 / audit', 'produit d’appel volontairement imbattable']
  ].forEach(([k, v, note]) => console.log('  ' + k.padEnd(42) + v.padEnd(20) + note));
  console.log('\nPositionnement recommandé :\n  • $5 reste le funnel : monter ensuite une offre « audit approfondi » à $25.\n  • Vendre les outils marché en bundle (~$9) plutôt qu’à l’unité (panier moyen ↑).\n  • Si un concurrent passe sous $3 : différencier par la profondeur, jamais par le prix.');
}
// demand-signals : signaux mesurables, chacun avec sa source datée (API).
async function cmdDemandSignals() {
  console.log('\n== DEMAND-SIGNALS (chaque signal = source datée) ==');
  const signals = [];
  const s1 = await ghApi('/search/repositories?q=' + encodeURIComponent('x402 audit') + '&per_page=3');
  if (s1.data) (s1.data.items || []).forEach((it) => signals.push(['Repo « audit » x402', it.full_name + ' ★' + it.stargazers_count, String(it.created_at || '').slice(0, 10), it.html_url]));
  const s2 = await ghApi('/search/issues?q=' + encodeURIComponent('x402 payment is:issue') + '&sort=updated&order=desc&per_page=3');
  if (s2.data) (s2.data.items || []).forEach((it) => signals.push(['Issue paiement x402', String(it.title || '').slice(0, 70), String(it.updated_at || '').slice(0, 10), it.html_url]));
  const s3 = await ghApi('/search/repositories?q=' + encodeURIComponent('x402 created:>' + daysAgoIso(30)) + '&per_page=5');
  if (s3.data) signals.push(['Nouveaux repos/vendeurs <30j', s3.data.total_count + ' créations récentes', daysAgoIso(30) + ' → aujourd’hui', GH_API + '/search/repositories?q=x402']);
  if (!signals.length) return console.log('Aucun signal récupérable maintenant (réseau/quota) — relancer plus tard.');
  signals.forEach((sg) => console.log('\n• [' + sg[2] + '] ' + sg[0] + ' : ' + sg[1] + '\n  source : ' + sg[3]));
  console.log('\nSeuil d’action : ≥3 signaux datés <30 jours → passer l’idée à validation-checklist.');
}
// persona-gen : persona détaillé (douleurs, canaux, objections, message clé).
function cmdPersonaGen(type) {
  console.log('\n== PERSONA-GEN ==');
  const P = {
    'dev-solo': {
      nom: 'Dev Solo Sam', contexte: 'Dev indie, shippe des side-projects la nuit, paie en crypto sans friction.',
      douleurs: ['Peur de mal implémenter x402 et perdre des ventes silencieusement', 'Aucun budget pour un auditeur humain ($100+)', 'Veut un rapport partageable pour rassurer ses users'],
      canaux: ['Twitter/X #buildinpublic', 'GitHub discussions x402', 'Discords hackathon'],
      objections: ['« Un bot peut-il vraiment auditer ? »', '« Pourquoi ne pas juste lire la doc ? »'],
      message: 'Ton endpoint x402 audité pour $5 — rapport en 2 minutes, paiement en USDC.'
    },
    'startup-crypto': {
      nom: 'Startup Crypto Nova', contexte: 'Équipe de 3-10, intègre x402 dans son produit, KPI = temps de mise en marché.',
      douleurs: ['Compliance interne exige une vérification tierce', 'Latence de paiement qui casse le tunnel agent', 'Besoin d’une preuve d’audit pour lever ou se lister'],
      canaux: ['Telegram crypto', 'LinkedIn', 'Conférences ETH/hackathons'],
      objections: ['« Notre équipe interne a déjà testé. »', '« Un PDF suffit-il à nos investisseurs ? »'],
      message: 'Audit x402 signé + badge vérifiable, livré avant votre prochaine démo.'
    },
    'agence-web': {
      nom: 'Agence Web Vertex', contexte: 'Agence qui monétise des sites clients et cherche un revenu additionnel.',
      douleurs: ['Sites clients mal référencés, budget SEO limité', 'Doit justifier chaque heure facturée', 'Cherche des rapports blancs à revendre'],
      canaux: ['Email froid B2B', 'Groupes Facebook/Slack d’agences', 'Upwork/Malt'],
      objections: ['« Nos outils actuels font déjà ça. »', '« Quel ROI concret pour mon client ? »'],
      message: 'Rapport SEO blanc-marque prêt à revendre au client — vous gardez la marge.'
    }
  };
  const p = P[type];
  if (!p) return console.log('Types disponibles : dev-solo | startup-crypto | agence-web\nExemple : persona-gen dev-solo');
  console.log('Persona : ' + p.nom + '\nContexte : ' + p.contexte);
  console.log('\nDouleurs :'); p.douleurs.forEach((d) => console.log('  - ' + d));
  console.log('\nCanaux :'); p.canaux.forEach((c) => console.log('  - ' + c));
  console.log('\nObjections :'); p.objections.forEach((o) => console.log('  - ' + o));
  console.log('\nMessage clé : « ' + p.message + ' »');
}
// validation-checklist : checklist de validation d’idée AVANT de coder.
function cmdValidationChecklist(idea) {
  console.log('\n== VALIDATION-CHECKLIST : ' + (idea || 'idée sans nom') + ' ==');
  [
    ['Demande', '≥3 signaux indépendants relevés et datés (lancer demand-signals)'],
    ['Canal', '1 canal de distribution identifié avec le premier message déjà écrit'],
    ['Client zéro', '1 prospect potentiel NOMMÉ (pseudo GitHub/X) ayant dit oui au principe'],
    ['Concurrence', 'competitor-pricing rempli pour ≥1 concurrent direct'],
    ['Prix', 'prix confronté à pricing-research : ni bradé, ni 10× le marché sans preuve'],
    ['Effort', 'build estimé ≤2 jours, sinon découper le MVP'],
    ['Sortie', 'critère d’abandon défini à l’avance (ex. 0 vente après 50 visiteurs qualifiés)']
  ].forEach(([cat, txt]) => console.log('  [ ] ' + cat.padEnd(13) + txt));
  console.log('\nRègle absolue : NE PAS coder tant que « Demande » ou « Client zéro » reste vide.');
}

function printHelp() {
  console.log('\nresearch-suite.js — étude de marché pour ' + SHOP_URL + '\nUsage : node research-suite.js <commande> [argument]\n\n  ' + [
    'market-size [niche]            chiffres réels GitHub/npm + estimation vendeurs',
    'competitor-pricing <nomOuUrl>  extraction $N de sa page pricing + cadre à compléter',
    'trend-watch                    repos <30j topics x402/mcp/ai-agents par étoiles',
    'audience-questions [source]    issues "how to"/"error" = questions utilisateurs',
    'niche-gaps                     awesome-x402 vs notre offre = trous du marché',
    'swot <sujet>                   analyse SWOT pré-remplie + questions de validation',
    'pricing-research               prix publics de l’écosystème + positionnement conseillé',
    'demand-signals                 signaux de demande mesurables, chacun daté/source',
    'persona-gen <typeClient>       dev-solo | startup-crypto | agence-web',
    'validation-checklist <idee>    checklist de validation avant de coder'
  ].join('\n  ') + '\n');
}
async function main() {
  const argv = process.argv.slice(2);
  switch (argv[0]) {
    case 'market-size': return cmdMarketSize(argv[1]);
    case 'competitor-pricing': return cmdCompetitorPricing(argv[1]);
    case 'trend-watch': return cmdTrendWatch();
    case 'audience-questions': return cmdAudienceQuestions(argv[1]);
    case 'niche-gaps': return cmdNicheGaps();
    case 'swot': return cmdSwot(argv.slice(1).join(' '));
    case 'pricing-research': return cmdPricingResearch();
    case 'demand-signals': return cmdDemandSignals();
    case 'persona-gen': return cmdPersonaGen(argv[1]);
    case 'validation-checklist': return cmdValidationChecklist(argv.slice(1).join(' '));
    default: printHelp();
  }
}
main().catch((err) => { console.error('Erreur fatale :', err.message); process.exit(1); });
