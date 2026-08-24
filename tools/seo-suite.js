#!/usr/bin/env node
// ============================================================================
// seo-suite.js — Suite SEO de la boutique x402 d’automaton-alpha
// Boutique : https://skintight-snowcap-underarm.ngrok-free.dev · Local : http://localhost:4020
// Pages : ~/automaton-work/x402-api/public · Zéro dépendance externe (natifs Node).
// Usage : node seo-suite.js <sous-commande> [arguments]
// ============================================================================
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const http = require('http'), https = require('https');
const SHOP_URL = 'https://skintight-snowcap-underarm.ngrok-free.dev';
const SHOP_HOST = new URL(SHOP_URL).host;
const LOCAL_URL = 'http://localhost:4020';
const PUBLIC_DIR = path.join(os.homedir(), 'automaton-work', 'x402-api', 'public');
const UA = 'automaton-alpha/1.0 (seo-suite)';

// GET http/https avec redirections ; renvoie toujours {status, body}, ne jette pas.
function fetchUrl(urlStr, timeoutMs) {
  const timeout = timeoutMs || 8000;
  return new Promise((resolve) => {
    const mod = urlStr.indexOf('https://') === 0 ? https : http;
    let req;
    try { // en-tête ngrok : évite la page d’avertissement du tunnel gratuit
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
// Page : serveur local d’abord (rapide), domaine public en secours.
async function getPage(p) {
  for (const base of [LOCAL_URL, SHOP_URL]) {
    const r = await fetchUrl(base + '/' + String(p || '').replace(/^\/+/, ''));
    if (r.status === 200 && r.body) return { url: base, body: r.body };
  }
  return null;
}
const isAlive = async (p) => (await fetchUrl(LOCAL_URL + '/' + p, 4000)).status === 200;
const listPages = () => { try { return fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.html')).sort(); } catch (e) { return []; } };
const readPage = (n) => { try { return fs.readFileSync(path.join(PUBLIC_DIR, n), 'utf8'); } catch (e) { return null; } };
// "pricing", "/pricing", URL absolue → nom de fichier local normalisé.
const normPage = (p) => { let n = String(p || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, ''); if (!n) n = 'index.html'; return /\.[a-z]+$/i.test(n) ? n : n + '.html'; };

// --- Extraction HTML (regex simples, aucun parser externe) --------------------
const attr = (tag, name) => { const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", 'i')); return m ? (m[2] !== undefined ? m[2] : m[3]) : null; };
const tagsOf = (html, tag) => html.match(new RegExp('<' + tag + '\\b[^>]*>', 'gi')) || [];
const metas = (html) => tagsOf(html, 'meta').map((t) => ({ name: ((attr(t, 'name') || attr(t, 'property')) || '').toLowerCase(), content: attr(t, 'content') || '' })).filter((x) => x.name);
const metaGet = (list, n) => { const h = list.find((x) => x.name === String(n).toLowerCase()); return h ? h.content : null; };
const titleOf = (html) => { const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? m[1].replace(/\s+/g, ' ').trim() : null; };
// Texte visible : sans script/style/commentaires/balises, entités usuelles décodées.
const textOf = (html) => html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
const ldBlocks = (html) => { const out = []; const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi; let m; while ((m = re.exec(html)) !== null) out.push(m[1].trim()); return out; };
const cut = (s, max) => { s = String(s || ''); return s.length <= max ? s : s.slice(0, max - 1) + '…'; };
const OK = '✓ CONFORME', BAD = '✗ MANQUANT', WARN = '⚠ A AMELIORER';
const row = (state, label, detail) => console.log('  ' + state.padEnd(14) + label.padEnd(24) + (detail || ''));

// 1) meta-audit : title/description/OG/h1 d’une page (ou de toutes si omise).
async function cmdMetaAudit(pageArg) {
  const pages = pageArg ? [normPage(pageArg)] : listPages();
  if (!pages.length) return console.log('\n== META-AUDIT ==\nAucune page HTML dans ' + PUBLIC_DIR);
  console.log('\n== META-AUDIT ==');
  for (const p of pages) {
    const r = await getPage(p);
    if (!r) { console.log('\n--- ' + p + ' : INTROUVABLE'); continue; }
    const ms = metas(r.body), t = titleOf(r.body), d = metaGet(ms, 'description'), img = metaGet(ms, 'og:image');
    const h1 = (r.body.match(/<h1\b/gi) || []).length, okT = t && t.length >= 30 && t.length <= 60, okD = d && d.length >= 70 && d.length <= 160;
    console.log('\n--- ' + p);
    row(!t ? BAD : (okT ? OK : WARN), !t ? 'title' : 'title (' + t.length + ' car.)', t ? '"' + cut(t, 42) + '"' + (okT ? '' : ' → viser 30-60') : '');
    row(!d ? BAD : (okD ? OK : WARN), !d ? 'meta description' : 'description (' + d.length + ' car.)', okD ? '' : '→ viser 70-160');
    ['og:title', 'og:description', 'og:image'].forEach((pr) => row(metaGet(ms, pr) ? OK : BAD, pr, ''));
    if (img && !/^https?:/i.test(img)) row(WARN, 'og:image', 'URL relative → préférer absolue');
    row(h1 === 1 ? OK : (h1 === 0 ? BAD : WARN), 'h1', h1 + ' balise(s) — viser exactement 1');
  }
}
// 2) schema-validate : JSON-LD (@type connu + champs requis, dont SoftwareApplication).
async function cmdSchemaValidate(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  console.log('\n== SCHEMA-VALIDATE (' + p + ') ==');
  if (!r) return console.log('Page introuvable');
  const blocks = ldBlocks(r.body);
  if (!blocks.length) return console.log('  ✗ Aucun JSON-LD → ajouter <script type="application/ld+json">.');
  const KNOWN = ['SoftwareApplication', 'Product', 'FAQPage', 'Organization', 'WebSite', 'Article', 'BlogPosting', 'BreadcrumbList', 'Service', 'Offer', 'ItemList'];
  const REQ = { SoftwareApplication: ['name', 'offers'], Product: ['name', 'offers'], FAQPage: ['mainEntity'], Article: ['headline', 'author'], BlogPosting: ['headline', 'author'], Organization: ['name'], WebSite: ['name', 'url'] };
  blocks.forEach((raw, i) => {
    console.log('\n--- Bloc JSON-LD #' + (i + 1));
    let data; try { data = JSON.parse(raw); } catch (e) { console.log('  ✗ JSON invalide : ' + e.message); return; }
    (Array.isArray(data['@graph']) ? data['@graph'] : [data]).forEach((node) => {
      const types = [].concat((node && node['@type']) || []);
      if (!types.length) return console.log('  ✗ @type absent');
      console.log('  @type=' + types.join(',') + ' → ' + (types.some((t) => KNOWN.indexOf(t) !== -1) ? 'type connu ✓' : '⚠ type hors liste de référence'));
      types.forEach((t) => (REQ[t] || []).forEach((f) =>
        console.log('    ' + f.padEnd(12) + (node[f] !== undefined && node[f] !== null && node[f] !== '' ? 'présent ✓' : 'MANQUANT ✗'))));
    });
  });
}
// 3) og-preview : carte de partage simulée (troncature 60/160 + image présente ?).
async function cmdOgPreview(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== OG-PREVIEW == Page introuvable');
  const ms = metas(r.body), t = metaGet(ms, 'og:title') || titleOf(r.body) || '', d = metaGet(ms, 'og:description') || metaGet(ms, 'description') || '';
  const img = metaGet(ms, 'og:image');
  console.log('\n== OG-PREVIEW (' + p + ') ==\n+----------------------------------------------------------+');
  console.log('| Image  : ' + (img ? 'présente ✓ ' + cut(img, 36) : 'ABSENTE ✗ → partage sans visuel'));
  console.log('| Titre  : "' + cut(t, 60) + '" ' + (t.length > 60 ? '⚠ tronqué (' + t.length + ' car.)' : '✓'));
  console.log('| Descr. : "' + cut(d, 160) + '"');
  console.log('|          ' + (d.length > 160 ? '⚠ tronquée (' + d.length + ' car.)' : d.length >= 50 ? '✓ longueur correcte' : '⚠ courte, viser ~110-160'));
  console.log('| Site   : ' + (metaGet(ms, 'og:site_name') || '(og:site_name absent)'));
  console.log('+----------------------------------------------------------+');
  if (!img) console.log('Conseil : ajouter une og:image absolue 1200x630px.');
}
// 4) robots-check : /robots.txt et /sitemap.xml existent ? cohérents avec le disque ?
async function cmdRobotsCheck() {
  console.log('\n== ROBOTS-CHECK ==');
  const rb = await fetchUrl(SHOP_URL + '/robots.txt'), sm = await fetchUrl(SHOP_URL + '/sitemap.xml');
  console.log('/robots.txt  : ' + (rb.status === 200 ? 'présent ✓' : 'ABSENT (' + (rb.status || rb.error) + ')'));
  console.log('/sitemap.xml : ' + (sm.status === 200 ? 'présent ✓' : 'ABSENT (' + (sm.status || sm.error) + ')'));
  if (rb.status === 200 && !/sitemap\s*:/i.test(rb.body)) console.log('⚠ robots.txt sans ligne "Sitemap:".');
  if (sm.status !== 200) return console.log('Conseil : générer un sitemap.xml et le déclarer dans robots.txt.');
  const paths = [], re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi; let m;
  while ((m = re.exec(sm.body)) !== null) { try { paths.push(new URL(m[1]).pathname); } catch (e) { paths.push(m[1]); } }
  const pages = listPages();
  console.log('\nCohérence sitemap (' + paths.length + ' URLs) ↔ disque (' + pages.length + ' pages) :');
  let missing = 0;
  pages.forEach((p) => {
    const pub = '/' + (p === 'index.html' ? '' : p);
    const found = paths.some((lp) => lp === pub || lp === '/' + p);
    if (!found) missing++;
    console.log('  ' + (found ? '✓ listée     ' : '✗ MANQUANTE  ') + pub);
  });
  if (!missing) console.log('→ Sitemap cohérent avec les pages publiées.');
}
// 5) keyword-density : top 10 mots en % + conseil suroptimisation (>3 % = spammeur).
async function cmdKeywordDensity(pageArg, word) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== KEYWORD-DENSITY == Page introuvable : ' + p);
  const words = textOf(r.body).toLowerCase().match(/[a-zà-ÿ0-9]{2,}/g) || [];
  const stop = new Set(['les', 'des', 'est', 'une', 'pour', 'avec', 'dans', 'sur', 'aux', 'que', 'qui', 'pas', 'par', 'plus', 'vous', 'votre', 'the', 'and', 'for', 'you', 'your', 'with', 'from', 'this', 'that', 'are', 'not', 'http', 'https', 'www', 'com']);
  const freq = {};
  words.forEach((w) => { if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const total = words.length || 1;
  console.log('\n== KEYWORD-DENSITY (' + p + ', ' + total + ' mots) ==');
  if (word) {
    const pct = 100 * words.filter((x) => x === word.toLowerCase()).length / total;
    return console.log('Densité "' + word + '" : ' + pct.toFixed(2) + ' % → ' + (pct > 3 ? '⚠ SPAMMEUR (>3 %), diluer le texte.' : '✓ raisonnable (cible 0,5–2,5 %).'));
  }
  Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 10).forEach((w, i) => {
    const pct = 100 * freq[w] / total;
    console.log('  ' + String(i + 1).padStart(2) + '. ' + w.padEnd(18) + freq[w] + '×  ' + pct.toFixed(2) + ' %' + (pct > 3 ? '  ⚠ SPAMMEUR' : ''));
  });
  console.log('Règle : aucun mot >3 % sinon filtre keyword stuffing.');
}
// Liens internes d’un HTML → chemins locaux dédupliqués (externes ignorés).
function internalTargets(html) {
  const out = []; const re = /<a\b[^>]*href\s*=\s*("[^"]*"|'[^']*')/gi; let m;
  while ((m = re.exec(html)) !== null) {
    const h = m[1].slice(1, -1);
    if (!h || /^(mailto|tel|javascript|#)/i.test(h)) continue;
    if (/^https?:\/\//i.test(h) && h.indexOf('localhost') === -1 && h.indexOf(SHOP_HOST) === -1) continue;
    let pp = h; try { pp = new URL(h, LOCAL_URL + '/').pathname; } catch (e) {}
    pp = pp.replace(/^\//, '') || 'index.html';
    if (!/\.[a-z]+$/i.test(pp)) pp += '.html';
    if (out.indexOf(pp) === -1) out.push(pp);
  }
  return out;
}
// 6) internal-links : liens morts (testés sur localhost:4020) + orphelins du site.
async function cmdInternalLinks(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== INTERNAL-LINKS == Page introuvable : ' + p);
  const targets = internalTargets(r.body);
  console.log('\n== INTERNAL-LINKS (' + p + ') — ' + targets.length + ' lien(s) interne(s) ==');
  for (const t of targets) console.log('  ' + ((await isAlive(t)) ? '✓ vivant' : '✗ MORT   ') + ' → ' + t);
  const inbound = {}; // carte inverse sur tout le site (lecture disque, sans réseau)
  listPages().forEach((src) => { const html = readPage(src); if (html) internalTargets(html).forEach((t) => { inbound[t] = (inbound[t] || 0) + 1; }); });
  const orphans = listPages().filter((pg) => !(inbound[pg] > 0));
  console.log('\nOrphelins (0 lien entrant interne) : ' + (orphans.length ? orphans.join(', ') : 'aucun ✓'));
}
// 7) speed-hints : poids HTML, ressources externes vs inline → 5 conseils concrets.
async function cmdSpeedHints(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== SPEED-HINTS == Page introuvable : ' + p);
  const html = r.body, scripts = tagsOf(html, 'script'), jsInline = scripts.length - scripts.filter((t) => /\bsrc\s*=/i.test(t)).length;
  const cssFiles = tagsOf(html, 'link').filter((t) => /stylesheet/i.test(t)).length;
  const imgs = tagsOf(html, 'img'), lazy = imgs.filter((t) => /loading\s*=\s*["']?lazy/i.test(t)).length;
  const tiers = {};
  (html.match(/(?:src|href)\s*=\s*"https?:\/\/[^/"]+/gi) || []).forEach((hit) => { // domaines tiers
    const host = hit.split('//')[1];
    if (host && host.indexOf(SHOP_HOST) === -1 && host.indexOf('localhost') === -1) tiers[host] = 1;
  });
  const kb = Buffer.byteLength(html, 'utf8') / 1024;
  console.log('\n== SPEED-HINTS (' + p + ') ==');
  console.log('HTML ' + kb.toFixed(1) + ' Ko | JS externes ' + (scripts.length - jsInline) + ' / inline ' + jsInline + ' | CSS liés ' + cssFiles + ' | images ' + imgs.length + ' (lazy ' + lazy + ') | domaines tiers ' + Object.keys(tiers).length);
  const tips = [
    kb > 100 ? 'HTML > 100 Ko : extraire les gros blocs répétés vers un fichier mis en cache.' : 'HTML léger (' + kb.toFixed(1) + ' Ko) : bon point, à préserver.',
    jsInline > 2 ? jsInline + ' <script> inline : regrouper en 1 fichier externe (cache navigateur).' : 'JS inline limité (' + jsInline + ') : OK.',
    imgs.length > lazy ? (imgs.length - lazy) + ' image(s) sans loading="lazy" : l’ajouter pour différer le chargement.' : 'Images déjà lazy ou absentes : rien à faire.',
    cssFiles > 2 ? cssFiles + ' feuilles CSS : fusionner en une seule pour moins d’allers-retours.' : 'CSS bien consolidé (' + cssFiles + ' fichier(s)).',
    Object.keys(tiers).length ? 'Ajouter <link rel="preconnect"> pour ' + Object.keys(tiers).join(', ') + '.' : 'Aucun domaine tiers : activer gzip/brotli côté serveur si absent.'
  ];
  console.log('\n5 conseils concrets :');
  tips.forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t));
}
// 8) alt-texts : images sans attribut alt (accessibilité + SEO images).
async function cmdAltTexts(pageArg) {
  console.log('\n== ALT-TEXTS ==');
  const pages = pageArg ? [normPage(pageArg)] : listPages();
  let missingTotal = 0;
  for (const p of pages) {
    const html = pageArg ? ((await getPage(p)) || {}).body : readPage(p);
    if (!html) { console.log('  ' + p + ' : introuvable'); continue; }
    const imgs = tagsOf(html, 'img'), noAlt = imgs.filter((t) => attr(t, 'alt') === null), emptyAlt = imgs.filter((t) => attr(t, 'alt') === '').length;
    missingTotal += noAlt.length;
    console.log('  ' + p.padEnd(28) + imgs.length + ' img · ' + noAlt.length + ' sans alt · ' + emptyAlt + ' alt vide');
    noAlt.slice(0, 5).forEach((t) => console.log('      ✗ ' + (attr(t, 'src') || '(sans src)').slice(0, 60)));
  }
  console.log(missingTotal ? '→ Décoratif : alt="" ; informatif : décrire en quelques mots.' : 'Toutes les images ont un attribut alt ✓');
}
// 9) canonical-check : balise canonical présente et pointant vers la bonne URL ?
async function cmdCanonicalCheck(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== CANONICAL-CHECK == Page introuvable : ' + p);
  const linkTag = tagsOf(r.body, 'link').find((t) => /rel\s*=\s*["']?canonical/i.test(t));
  const expected = SHOP_URL + '/' + (p === 'index.html' ? '' : p);
  console.log('\n== CANONICAL-CHECK (' + p + ') ==');
  if (!linkTag) return console.log('  ✗ Absente.\n  Conseil : <link rel="canonical" href="' + expected + '">');
  const got = attr(linkTag, 'href') || '';
  console.log('  présente ✓ → ' + got);
  console.log(got.replace(/\/+$/, '') === expected.replace(/\/+$/, '') ? '  ✓ correspond à l’URL publique attendue' : '  ⚠ attendue : ' + expected);
}
// 10) serp-preview : simulation du résultat Google (URL, titre, description).
async function cmdSerpPreview(pageArg) {
  const p = normPage(pageArg), r = await getPage(p);
  if (!r) return console.log('\n== SERP-PREVIEW == Page introuvable : ' + p);
  const t = titleOf(r.body) || '(aucun titre)';
  const d = metaGet(metas(r.body), 'description') || '(aucune meta description → extrait arbitraire Google)';
  console.log('\n== SERP-PREVIEW ==\n  ' + SHOP_URL + '/' + (p === 'index.html' ? '' : p));
  console.log('  ▌' + cut(t, 60) + (t.length > 60 ? ' [tronqué]' : ''));
  console.log('  ' + cut(d, 158) + (d.length > 158 ? ' [tronqué]' : ''));
  console.log('\nLongueurs : titre ' + t.length + '/60 · description ' + d.length + '/158.');
}
// 11) hreflang-audit : pertinent seulement si le site existe en plusieurs langues.
async function cmdHreflangAudit() {
  console.log('\n== HREFLANG-AUDIT ==');
  const found = [];
  listPages().forEach((p) => {
    const html = readPage(p); if (!html) return;
    tagsOf(html, 'link').forEach((t) => { if (/rel\s*=\s*["']?alternate/i.test(t) && /hreflang/i.test(t)) found.push('  ' + p + ' → hreflang=' + (attr(t, 'hreflang') || '?')); });
  });
  if (!found.length) {
    console.log('Aucune balise hreflang → site mono-langue : rien à faire ✓');
    console.log('Conseil : n’ajouter hreflang QUE si une vraie traduction existe (/fr/, /en/) ;');
    console.log('déclarer des langues sans contenu traduit crée des signaux incohérents pour Google.');
  } else {
    console.log(found.join('\n'));
    console.log('Vérifier : paires réciproques, un hreflang="x-default", URLs absolues.');
  }
}
// 12) structured-data-plan : quel schéma JSON-LD ajouter sur quelle page manquante.
function cmdStructuredDataPlan() {
  console.log('\n== STRUCTURED-DATA-PLAN ==');
  const PLAN = [
    [/^index\.html$/, 'WebSite + SoftwareApplication', 'identifier la boutique et son produit phare (audit $5)'],
    [/(pricing|tarif|offer|audit)/, 'Product + Offer', 'afficher le prix $5 directement dans Google'],
    [/faq/, 'FAQPage', 'extraits enrichis Questions/Réponses'],
    [/(blog|post|article|guide)/, 'Article/BlogPosting', 'auteur + date lisibles par les moteurs'],
    [/(about|contact)/, 'Organization + ContactPoint', 'confiance E-E-A-T, coordonnées exploitables'],
    [/(tool|market|research|doc)/, 'ItemList + SoftwareApplication', 'catalogue d’outils balisé']
  ];
  const pages = listPages();
  if (!pages.length) return console.log('Aucune page dans ' + PUBLIC_DIR);
  pages.forEach((p) => {
    const rec = PLAN.find((x) => x[0].test(p)) || [/./, 'BreadcrumbList', 'fil d’Ariane minimal'];
    const src = readPage(p), hasLd = !!src && /application\/ld\+json/i.test(src);
    console.log('  ' + (hasLd ? '✓ déjà balisée  ' : '✗ À AJOUTER    ') + p.padEnd(32) + '→ ' + rec[1] + '\n       ' + rec[2]);
  });
  if (!pages.some((p) => /faq/.test(p))) console.log('\n💡 Pas de FAQ : page FAQ + schéma FAQPage = chemin le plus court vers des rich snippets.');
  if (!pages.some((p) => /(pricing|tarif)/.test(p))) console.log('💡 Pas de page pricing dédiée : les crawlers associent mal le prix $5 au produit.');
}

function printHelp() {
  console.log('\nseo-suite.js — SEO de la boutique ' + SHOP_URL + '\nUsage : node seo-suite.js <commande> [page]\n\n  ' + [
    'meta-audit [page]            title/description/OG/h1 (toutes pages si omise)',
    'schema-validate <page>       blocs JSON-LD : @type connu + champs requis',
    'og-preview <page>            carte de partage Open Graph simulée',
    'robots-check                 robots.txt + sitemap.xml vs pages publiées',
    'keyword-density <page> [mot] top 10 mots + densité % (+ alerte >3 %)',
    'internal-links <page>        liens internes morts + pages orphelines',
    'speed-hints <page>           poids HTML, ressources, 5 conseils vitesse',
    'alt-texts [page]             images sans attribut alt',
    'canonical-check <page>       balise canonical présente et correcte ?',
    'serp-preview <page>          apparence simulée dans Google',
    'hreflang-audit               pertinence multi-langue (conseil si mono-langue)',
    'structured-data-plan         quels schémas JSON-LD ajouter sur quelles pages'
  ].join('\n  ') + '\n');
}
async function main() {
  const argv = process.argv.slice(2);
  switch (argv[0]) {
    case 'meta-audit': return cmdMetaAudit(argv[1]);
    case 'schema-validate': return cmdSchemaValidate(argv[1]);
    case 'og-preview': return cmdOgPreview(argv[1]);
    case 'robots-check': return cmdRobotsCheck();
    case 'keyword-density': return cmdKeywordDensity(argv[1], argv[2]);
    case 'internal-links': return cmdInternalLinks(argv[1]);
    case 'speed-hints': return cmdSpeedHints(argv[1]);
    case 'alt-texts': return cmdAltTexts(argv[1]);
    case 'canonical-check': return cmdCanonicalCheck(argv[1]);
    case 'serp-preview': return cmdSerpPreview(argv[1]);
    case 'hreflang-audit': return cmdHreflangAudit();
    case 'structured-data-plan': return cmdStructuredDataPlan();
    default: printHelp();
  }
}
main().catch((err) => { console.error('Erreur fatale :', err.message); process.exit(1); });
