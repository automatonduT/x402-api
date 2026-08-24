// market-macro.js [v1] - GET /tools/market/macro : prochaines dates FOMC + CPI (sources officielles, cache 12h)
const express=require("express"),fs=require("fs"),path=require("path"),https=require("https");
const rt=express.Router();
const CACHE=path.join(__dirname,"data","macro-cache.json"),TTL=12*3600e3;
const UA={"User-Agent":"Mozilla/5.0 (compatible; micro-tools-agent/1.0)"};
function get(url){return new Promise((res,rej)=>{https.get(url,{headers:UA},r=>{
  if(r.statusCode!==200){r.resume();return rej(new Error("HTTP "+r.statusCode))}
  let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d))}).on("error",rej)})}
function uniqSorted(a){return [...new Set(a)].sort().slice(0,8)}
async function fresh(){
  const out={fomc:[],cpi:[],sources:{}};
  try{ // calendrier FOMC officiel
    const h=await get("https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm");
    const m=[...h.matchAll(/(20\d\d)\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)[^<]{0,80}/g)];
    // fallback robuste: extraire les blocs de reunion "Month Day-Day, YYYY"
    const re=/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[-\u2013]\s*\d{1,2},?\s+(20\d\d)/g;
    const MO={January:"01",February:"02",March:"03",April:"04",May:"05",June:"06",July:"07",August:"08",September:"09",October:"10",November:"11",December:"12"};
    let ds=[];for(const x of h.matchAll(re))ds.push(`${x[4]||x[3]}-${MO[x[1]]}-${String(x[2]).padStart(2,"0")}`);
    out.fomc=uniqSorted(ds.filter(d=>d>new Date().toISOString().slice(0,10)));
    out.sources.fomc="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
  }catch(e){out.sources.fomcError=String(e.message||e)}
  try{ // calendrier CPI officiel (BLS)
    const h2=await get("https://www.bls.gov/schedule/news_release/cpi.htm");
    const re2=/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/g;
    const MO={January:"01",February:"02",March:"03",April:"04",May:"05",June:"06",July:"07",August:"08",September:"09",October:"10",November:"11",December:"12"};
    let ds2=[];for(const x of h2.matchAll(re2))ds2.push(`${x[3]}-${MO[x[2]]}-${String(x[1]).padStart(2,"0")}`);
    out.cpi=uniqSorted(ds2.filter(d=>d>new Date().toISOString().slice(0,10)));
    out.sources.cpi="https://www.bls.gov/schedule/news_release/cpi.htm";
  }catch(e){out.sources.cpiError=String(e.message||e)}
  return out}
const CURATED=path.join(__dirname,"data","macro-curated.json");
rt.get("/tools/market/macro",async(q,r)=>{
  try{
    const cur=JSON.parse(fs.readFileSync(CURATED,"utf8"));
    let scraped=null,fresh_=false;
    try{const j=JSON.parse(fs.readFileSync(CACHE,"utf8"));if(Date.now()-j._t<TTL)scraped=j}catch(e){}
    if(!scraped){try{scraped=await fresh();scraped._t=Date.now();fs.mkdirSync(path.dirname(CACHE),{recursive:true});fs.writeFileSync(CACHE,JSON.stringify(scraped,null,1));fresh_=true}catch(e){}}
    const today=new Date().toISOString().slice(0,10);
    // baseline curree = autorite; scrape ne fait qu'ajouter des dates non couvertes
    const fomc=[...new Set([...(cur.fomc||[]),...((scraped&&scraped.fomc)||[])])].filter(d=>d>=today).sort();
    r.json({next:{fomc:fomc[0]||null,cpi:null},
      upcoming:{fomc:fomc.slice(0,8)},
      cpi:{dates:[],note:(cur.cpiNote||"")+" - planifie manuellement ou attendre un acces non bloque"},
      basis:"baseline curree depuis publications officielles (asOf "+cur.asOf+")"+((scraped&&fresh_)?" + scrape du jour":""),
      sources:{fomc:"https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
               cpi:"https://www.bls.gov/schedule/news_release/cpi.htm"},
      disclaimer:"dates officielles Fed/BLS - verification humaine recommandee avant toute decision",
      docs:"/pricing.html",asOf:new Date().toISOString()});
  }catch(e){r.status(502).json({error:String(e.message||e)})}
});
module.exports=rt;
