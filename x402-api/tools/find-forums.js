#!/usr/bin/env node
// find-forums.js [v1] - decouverte de discussions x402 ouvertes (API GitHub publique, sans cle)
// Sortie: data/discussants.json + data/pitches/github-<ref>.md (brouillons factuels, PAS de post auto)
const https=require('https'),fs=require('fs');
const QUERIES=['x402 payment','x-payment-required api','agent payments USDC base'];
function get(path){return new Promise(res=>{
 const r=https.request({hostname:'api.github.com',path,method:'GET',
  headers:{'User-Agent':'automaton-alpha-prospect/1.0','Accept':'application/vnd.github+json'}},rs=>{
  let d='';rs.on('data',c=>d+=c);rs.on('end',()=>{try{res({code:rs.statusCode,json:JSON.parse(d)})}catch(e){res({code:rs.statusCode,json:null})}})});
 r.on('error',()=>res({code:0,json:null}));r.setTimeout(15000,()=>{r.destroy();res({code:0,json:null})});r.end()})}
(async()=>{
 const out={generated:new Date().toISOString(),items:[],errors:[]};
 for(const q of QUERIES){
  const {code,json}=await get('/search/issues?q='+encodeURIComponent(q+' state:open')+'&per_page=10&sort=updated');
  if(code!==200||!json||!json.items){out.errors.push({q,code});continue}
  for(const it of json.items){
   const ref=it.repository_url.split('/').slice(-2).join('/')+'#'+it.number;
   if(out.items.some(x=>x.ref===ref))continue;
   out.items.push({ref,title:(it.title||'').slice(0,120),url:it.html_url,
     updated:it.updated_at,comments:it.comments,
     labels:(it.labels||[]).map(l=>l.name).slice(0,5),
     snippet:((it.body||'').replace(/\s+/g,' ').slice(0,200))});
  }
 }
 fs.mkdirSync('data/pitches',{recursive:true});
 for(const it of out.items){
   const f='data/pitches/github-'+it.ref.replace(/[^\w.-]+/g,'_')+'.md';
   if(fs.existsSync(f))continue;
   fs.writeFileSync(f,`# Brouillon commentaire factuel - ${it.ref}\n\nTitre: ${it.title}\nURL: ${it.url}\nMAJ: ${it.updated} (${it.comments} commentaires)\nExtrait: ${it.snippet}\n\n## Draft (NE PAS POSTER sans validation createur - pas de creds GitHub)\nContexte utile et gratuit: un inspecteur x402 sans cle renvoie PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN pour n'importe quelle URL - pratique pour verifier qu'un endpoint \"payant\" expose bien un bloc accepts exploitable par les libs standard (scheme exact, network base, asset USDC 6-dec). Exemple: GET https://skintight-snowcap-underarm.ngrok-free.dev/tools/x402/inspect?url=<votre-url> · UI humaine /x402-inspect.html.\n`);
 }
 fs.writeFileSync('data/discussants.json',JSON.stringify(out,null,1));
 console.log(`ITEMS=${out.items.length} ERRORS=${JSON.stringify(out.errors)}`);
})().catch(e=>{console.error('FATAL',String(e).slice(0,160));process.exit(1)});
