#!/usr/bin/env node
// journal-stats.js [v1] - rapport hebdo trading paper: carry vs buy&hold + journal signaux -> ledger
const fs=require("fs"),path=require("path"),https=require("https");
const ROOT=path.join(__dirname,"..");
const read=(f)=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8"))}catch(e){return null}};
function get(url){return new Promise((res,rej)=>{https.get(url,{headers:{}} ,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on("error",rej)})}
(async()=>{
  const out={generated:new Date().toISOString(),carry:null,journal:null,verdicts:[]};
  const cs=read("carry-state.json");
  if(cs&&cs.positions){
    const syms=Object.keys(cs.positions);
    const px={};
    for(const s of syms){
      try{const j=await get(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`);px[s]=+j.price}catch(e){px[s]=cs.positions[s].lastPx}
    }
    let eq=1,bh=1,detail=[];
    for(const s of syms){
      const p=cs.positions[s];
      const leg=p.equity*(1+(p.collected||0));
      // prix relatif depuis entree (long spot)
      const pxr=px[s]/p.entry;
      bh*=pxr;
      detail.push({sym:s,entry:p.entry,last:px[s],pxRet:+((pxr-1)*100).toFixed(4)+"%",
        fundingCollected:+(p.collected||0).toFixed(6),periods:p.periods||0});
    }
    let tot=0;for(const s of syms){const p=cs.positions[s];tot+=(p.equity*(px[s]/p.entry)-p.equity)+(p.collected||0)}
    const ageH=((Date.now()-new Date(cs.created))/36e5).toFixed(1);
    out.carry={created:cs.created,ageHours:+ageH,positions:detail,
      paperReturnPct:+(tot*100).toFixed(4),
      buyHoldPct:+((bh-1)*100).toFixed(4),
      edgePct:+(tot*100-(bh-1)*100).toFixed(4)};
  }
  const sj=read("signals-journal.json");
  if(sj){
    out.journal={signals:sj.signals.length,refused:(sj.refused||[]).length,closed:sj.signals.filter(s=>s.status==="closed").length,
      wins:sj.signals.filter(s=>s.result==="WIN").length,losses:sj.signals.filter(s=>s.result==="LOSS").length};
  }
  console.log(JSON.stringify(out,null,1));
  fs.writeFileSync(path.join(ROOT,"journal-latest.json"),JSON.stringify(out,null,1));
})().catch(e=>{console.error("ERREUR",e.message);process.exit(1)});
