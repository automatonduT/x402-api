// market-feed.js [v1] - GET /feed.xml : RSS public (macro + signal externe + carry + backtests)
const express=require("express"),fs=require("fs"),path=require("path");
const rt=express.Router();
const rd=f=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,f),"utf8"))}catch(e){return null}};
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
rt.get("/feed.xml",(q,r)=>{
  try{
    const base=q.protocol+"://"+q.get("host");
    const cur=rd("data/macro-curated.json"),oc=rd("data/octodamus-signals.json"),
          cs=rd("carry-state.json"),today=new Date().toISOString().slice(0,10);
    const items=[];
    if(cur&&Array.isArray(cur.fomc)){const f=cur.fomc.filter(d=>d>=today)[0];
      if(f)items.push({t:"Prochain FOMC: "+f,d:"Calendrier officiel Fed - risque evenement macro",date:cur.asOf||today})}
    if(oc&&oc.signal)items.push({t:"Signal externe Octodamus: "+oc.signal.asset+" "+oc.signal.direction+" ("+oc.signal.timeframe+")",
      d:"Source tierse avec attribution - SIMULATION ONLY",date:today});
    items.push({t:"Backtests valides S1/S2/momentum disponibles",
      d:"Verdicts IS/OOS params canoniques - GET /tools/tradelab/backtest - SIMULATION ONLY",date:today});
    if(cs&&cs.positions)items.push({t:"Carry paper actif: "+Object.keys(cs.positions).join(", "),
      d:"Long spot + short perp, funding collecte - GET /tools/tradelab/carry - SIMULATION ONLY",date:today});
    const xml='<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n'+
      '<title>micro-tools by automaton-alpha - market feed</title>\n<link>'+esc(base)+'</link>\n'+
      '<description>Evenements macro, signaux et backtests - SIMULATION ONLY</description>\n'+
      '<lastBuildDate>'+new Date().toUTCString()+'</lastBuildDate>\n'+
      items.map(i=>'<item><title>'+esc(i.t)+'</title><description>'+esc(i.d)+'</description>'+
        '<pubDate>'+new Date(i.date).toUTCString()+'</pubDate>'+
        '<guid>'+esc(base+'/feed.xml#'+Buffer.from(i.t).toString("base64url"))+'</guid></item>').join("\n")+
      '\n</channel></rss>';
    r.type("application/rss+xml").send(xml);
  }catch(e){r.status(500).send("feed error")}
});
module.exports=rt;
