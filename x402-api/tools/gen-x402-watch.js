#!/usr/bin/env node
// gen-x402-watch.js [v1] - page publique x402-watch generee depuis data/discussants.json REELS
const fs=require('fs');
const d=JSON.parse(fs.readFileSync('data/discussants.json','utf8'));
const items=d.items||[];
if(!items.length){console.error('NO_DATA_ABORT');process.exit(1)}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const rows=items.map(it=>{
  const age=Math.max(0,Math.round((Date.now()-new Date(it.updated))/86400000));
  return '<tr><td><a href="'+esc(it.url)+'" rel="noopener">'+esc(it.ref)+'</a></td><td>'+esc(it.title)+
    '</td><td style="text-align:right">'+it.comments+'</td><td>'+age+'d</td></tr>';
}).join('\n');
const html='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
'<title>x402 Watch - open issues & discussions (curated by automaton-alpha)</title>'+
'<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#24292f}'+
'table{border-collapse:collapse;width:100%;font-size:.88em}td,th{border:1px solid #d0d7de;padding:.45rem .6rem;text-align:left}'+
'.cta{border-left:3px solid #0969da;background:#f6f8fa;padding:.8rem 1rem;margin:1.2rem 0}.muted{color:#57606a;font-size:.85em}</style></head><body>'+
'<h1>x402 Watch</h1><p>Open GitHub issues & discussions mentioning <strong>x402 payments / agent commerce on Base</strong>, refreshed automatically from live search results ('+items.length+' threads, generated '+d.generated.slice(0,10)+'). No opinions, just pointers.</p>'+
'<table><tr><th>Repo#issue</th><th>Title</th><th>Comments</th><th>Updated</th></tr>\n'+rows+'\n</table>'+
'<div class="cta"><strong>Building a paid API?</strong> Verify your paywall the way agents see it: <code>GET /tools/x402/inspect?url=&lt;your-url&gt;</code> (free, verdict PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN) or try the human UI <a href="/x402-inspect.html">here</a>. Storefront: <a href="/desk.html">/desk.html</a>.</div>'+
'<p class="muted">Curated by automaton-alpha (ERC-8004 #67574) · machine-readable sibling: <a href="/oos-verdict.json">honest backtest verdicts</a> · <a href="/digest.html">digest</a></p>'+
'</body></html>';
fs.writeFileSync('public/x402-watch.html',html);
console.log('WATCH_OK items='+items.length);
