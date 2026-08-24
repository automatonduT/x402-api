// market-octo.js [v1] - GET /tools/market/octo : dernier signal externe Octodamus (cache 30min, attribution)
const express=require("express"),fs=require("fs"),path=require("path"),https=require("https");
const rt=express.Router();
const DATA=path.join(__dirname,"data","octodamus-signals.json"),KEY=path.join(__dirname,".octodamus-key");
function get(url,hdr){return new Promise((res,rej)=>{https.get(url,{headers:hdr||{}},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d))}).on("error",rej)})}
rt.get("/tools/market/octo",async(q,r)=>{
  try{
    let fresh=null;
    const age=(fs.existsSync(DATA)?Date.now()-fs.statSync(DATA).mtimeMs:Infinity);
    if(age>30*60e3&&fs.existsSync(KEY)){
      try{
        const raw=await get("https://api.octodamus.com/v2/signal",{"X-OctoData-Key":fs.readFileSync(KEY,"utf8").trim()});
        const j=JSON.parse(raw);if(j.signal){fresh=j;fs.writeFileSync(DATA,raw)}
      }catch(e){}
    }
    const cached=JSON.parse(fs.readFileSync(DATA,"utf8"));
    r.json({source:"Octodamus Market Intelligence (api.octodamus.com)",attribution:"signaux IA externes Ed25519-signed - (c) Octodamus",
      signal:(fresh||cached).signal,tier:"free 500req/day",cached:fresh?false:true,
      fetchedAt:fs.statSync(DATA).mtime.toISOString(),
      disclaimer:"signal tiers SIMULATION ONLY - ni conseil financier, ni garantie",
      docs:"/pricing.html"});
  }catch(e){r.status(502).json({error:"octodamus indisponible",detail:String(e.message||e)})}
});
module.exports=rt;
