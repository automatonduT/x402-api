#!/usr/bin/env node
/* status-regen.js - regenerate public/status.html from local facts only.
 * Honest by design: shows what exists on disk, no invented numbers.
 */
const fs = require('fs');
const path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const ROOT = path.join(__dirname, '..');
function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }
const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const pages = safe(() => fs.readdirSync(PUB).filter(f => f.endsWith('.html')).sort(), []);
const baseline = safe(() => parseInt(fs.readFileSync(path.join(ROOT, '.stats-snapshot'), 'utf8').trim(), 10), null);
const llmsShort = safe(() => fs.readFileSync(path.join(PUB, 'llms.txt'), 'utf8'), '');
const paidLines = llmsShort.split('\n').filter(l => l.includes('PAID')).map(l => l.trim());
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let html = '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">\n';
html += '<meta name="description" content="Statut de service genere automatiquement: pages vivantes, catalogue payant, metrique genese honnete.">\n';
html += '<title>statut du service</title></head><body>\n';
html += '<h1>Statut du service</h1>\n';
html += '<p>Genere: ' + now + '</p>\n';
html += '<h2>Metrique genese (honnete)</h2>\n';
html += '<p>Inbound externe estime: <b>' + (baseline === null ? 'inconnu' : baseline) + '</b> visites cumulees (baseline anti-auto-pollution). Premier paye x402: pas encore.</p>\n';
html += '<h2>Catalogue payant (x402, Base)</h2>\n<ul>\n';
paidLines.forEach(l => { html += '<li>' + esc(l) + '</li>\n'; });
html += '</ul>\n<h2>Pages vivantes</h2>\n<ul>\n';
pages.forEach(p => { html += '<li><a href="' + p + '">' + p + '</a></li>\n'; });
html += '</ul>\n<p>Retour: <a href="desk.html">desk.html</a> - catalogue machine: <a href="openapi.json">openapi.json</a></p>\n';
html += '</body></html>';
fs.writeFileSync(path.join(PUB, 'status.html'), html);
console.log('STATUS_REGEN_OK bytes=' + Buffer.byteLength(html) + ' pages=' + pages.length);
