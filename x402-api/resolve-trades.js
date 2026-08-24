// resolve-trades v2: closes PENDING paper trades vs real Binance prices. Idempotent.
function klMfe(sym){return new Promise((res,rej)=>{require("https").get("https://api.binance.com/api/v3/klines?symbol="+sym+"&interval=15m&limit=200",{headers:{accept:"application/json"}},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{res(JSON.parse(d));}catch(e){rej(e);}});}).on("error",rej).setTimeout(10000,function(){this.destroy(new Error("timeout"));});});}
const fs = require("fs");
const https = require("https");
const LEDGER = require("path").join(__dirname, "..", "experiments.md");
function getJson(url){return new Promise((res,rej)=>{https.get(url,{headers:{accept:"application/json"}},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{res(JSON.parse(d));}catch(e){rej(e);}});}).on("error",rej).setTimeout(8000,function(){this.destroy(new Error("timeout"));});});}
(async()=>{
 let txt;try{txt=fs.readFileSync(LEDGER,"utf8");}catch(e){return;}
 const rows=txt.split("\n");const pending=[];
 rows.forEach((row,i)=>{
  if(!row.includes("| PAPER |")||!row.includes("verdict=PENDING"))return;
  const m=row.match(/\| PAPER \| [^|]+\| (\w+) (\w+): (\w+) entry=([\d.]+) stop=([\d.]+|-) target=([\d.]+|-)/);
  if(m)pending.push({i,sym:m[1],kind:m[2],side:m[3],entry:+m[4],stop:m[5]==="-"?null:+m[5],target:m[6]==="-"?null:+m[6]});
 });
 if(!pending.length){console.log("nothing pending");return;}
 let resolved=0;
 for(const s of [...new Set(pending.map(p=>p.sym))]){
  try{
   const t=await getJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`);const px=+t.lastPrice;
   for(const p of pending.filter(x=>x.sym===s)){
    let res=null;
    if(p.side==="LONG"){if(px<=p.stop)res=`LOSS(stop-hit @${px}, entry ${p.entry})`;else if(px>=p.target)res=`WIN(target-hit @${px}, entry ${p.entry})`;}
    else if(p.side==="SHORT"){if(px>=p.stop)res=`LOSS(stop-hit @${px}, entry ${p.entry})`;else if(px<=p.target)res=`WIN(target-hit @${px}, entry ${p.entry})`;}
    if(res){const em=row.match(/entry=([\d.]+)/);let grade="";
    try{const et=new Date(row.split("|")[1].trim()).getTime();
     if(em&&isFinite(et)){const ks=await klMfe(sym);
      const win=ks.filter(k=>k[0]>=et);
      if(win.length){const hi=Math.max(...win.map(k=>+k[2])),lo=Math.min(...win.map(k=>+k[3]));
       const en=parseFloat(em[1]);const mfe=((hi-en)/en*100),mae=((en-lo)/en*100);
       grade=" mfe="+mfe.toFixed(2)+"% mae="+mae.toFixed(2)+"%";
       rows[p.i]=rows[p.i]+" "+grade.trim();}}}catch(_){}
    rows[p.i]=rows[p.i].replace("plan:pending","plan:auto-closed");resolved++;}
   }
  }catch(e){}
 }
 rows.forEach((row,i)=>{if(row.includes("| PAPER |")&&row.includes("verdict=PENDING")&&row.includes("entry=-")){rows[i]=row.replace(/verdict=PENDING[^|]*/,"verdict=CLOSED-NO-TRADE");resolved++;}});
 if(resolved>0){fs.writeFileSync(LEDGER,rows.join("\n"));console.log(`resolved ${resolved}/${pending.length}`);}
 else console.log(`${pending.length} still open`);
})();
