#!/usr/bin/env node
// find-prospects.js [v1] - x402 prospecteur a defauts (filtres affines v2 marathon)
// Usage: node find-prospects.js  =>  data/prospects.json + data/pitches/<host>.md
const {execSync}=require('child_process'),fs=require('fs');
const EXCLUDE=/(mozilla|pypi\.org|shields\.io|npmjs\.com|w3\.org|mdn|github\.com\/Conway-Research|ngrok-free\.dev|localhost|127\.0\.0\.1)/i;
const QUERIES=[
 '"x402" "402 Payment Required" endpoint',
 '"accepts" "x-payment" paywall API',
 'x402 protocol paid API developers',
 '"USDC" "Base" API "per request" pricing'];
function sh(c){try{return execSync(c,{timeout:25000,encoding:'utf8'})}catch(e){return (e.stdout||'').toString()}}
function urlsFrom(txt){return [...new Set((txt.match(/https?:\/\/[^\s"'<>\)]+/g)||[]).map(u=>u.replace(/[.,;]+$/,'')))]}
(async()=>{
 const out={generated:new Date().toISOString(),defects:[],discussants:[],scanned:0};
 const seen=new Set();
 for(const q of QUERIES){
  const raw=sh(`bash tools/websearch.sh ${JSON.stringify(q)} 2>/dev/null`);
  for(const u of urlsFrom(raw)){
   if(EXCLUDE.test(u))continue;
   const host=(u.match(/^https?:\/\/([^\/]+)/)||[])[1];if(!host||seen.has(host))continue;seen.add(host);
   out.scanned++;
   const code=sh(`curl -s -o /tmp/pp-body -w '%{http_code}' -m 12 -A 'automaton-alpha-prospect/1.0' ${JSON.stringify(u)}`).trim();
   const body=fs.existsSync('/tmp/pp-body')?fs.readFileSync('/tmp/pp-body','utf8'):'';fs.rmSync('/tmp/pp-body',{force:true});
   const talksX402=/x402|payment required|accepts/i.test(body);
   if(code==='402'){
     const hasAccepts=/"accepts"\s*:|x-payment-accepts/i.test(JSON.stringify(sh(`curl -s -D - -o /dev/null -m 10 ${JSON.stringify(u)}`))+body);
     if(!hasAccepts){out.defects.push({url:u,host,defect:'402_SANS_ACCEPTS',evidence:'HTTP 402 without machine-parseable accepts block'});}
     else out.discussants.push({url:u,host,note:'proper 402+accepts'});
   } else if(talksX402&&/(issue|discussions|forum|questions)/i.test(u)){
     out.discussants.push({url:u,host,note:'x402 discussion surface'});
   }
  }
 }
 // pitch factuel par defaut
 fs.mkdirSync('data/pitches',{recursive:true});
 for(const d of out.defects){
   const md=`# Pitch factuel - ${d.host}\n\n- URL observee: ${d.url}\n- Defaut: ${d.defect}\n- Preuve: ${d.evidence} (observe ${out.generated})\n- Fix une-ligne: renvoyer un bloc JSON "accepts" (scheme exact, network base, asset USDC 6-dec) dans le corps du 402.\n- Offre gratuite: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=${encodeURIComponent(d.url)}\n- UI humaine: /x402-inspect.html\n\n(Envoi: AUCUN canal sortant fiable actuellement - relais social en panne. Pitch PREPARE seulement.)\n`;
   fs.writeFileSync(`data/pitches/${d.host}.md`,md);
 }
 fs.writeFileSync('data/prospects.json',JSON.stringify(out,null,1));
 console.log(`SCANNED=${out.scanned} DEFECTS=${out.defects.length} DISCUSSANTS=${out.discussants.length}`);
})().catch(e=>{console.error('FATAL',String(e).slice(0,200));process.exit(1)});
