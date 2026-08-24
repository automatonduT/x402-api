// gen-digest.js v5 - genere public/digest.html depuis artefacts reels. Abort si aucune donnee.
const fs=require("fs"),path=require("path");
const X=path.join(__dirname,"..");
const D=path.join(process.env.HOME,"automaton-work","data");
const R=p=>{try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch(e){return null}};

const mac=R(path.join(X,"data","macro-curated.json"));
const oct=R(path.join(X,"data","octodamus-signals.json"));
const jr=R(path.join(X,"journal-latest.json"));
const bt=R(path.join(D,"backtest-results.json"))||R(path.join(D,"oos-summary.json"));

const today=new Date().toISOString().slice(0,10);
let fomc=((mac&&mac.fomc)||[]).find(d=>d>=today)||null;
let days=fomc?Math.round((new Date(fomc)-new Date())/864e5):null;

let rows="";
try{
  const out=[];
  const num=v=>{const n=+v;return isNaN(n)?NaN:n};
  const res=(bt&&bt.results!==undefined)?bt.results:bt;
  if(res&&Array.isArray(res)){
    for(const r of res){
      if(!r||typeof r!=="object")continue;
      for(const k of Object.keys(r)){
        const v=r[k];
        if(v&&typeof v==="object"&&!Array.isArray(v)){
          const o=(v.OOS&&typeof v.OOS==="object")?v.OOS:v;
          if(o&&(o.ann!==undefined||o.sharpe!==undefined))
            out.push({sym:String(r.symbol||r.sym||"?").replace(/usdt$/i,"").toUpperCase(),st:k,
              a:num(o.ann),sh:num(o.sharpe),dd:num(o.maxDD)});
        }
      }
    }
  }else if(res&&typeof res==="object"){
    for(const sym of Object.keys(res)){
      const v=res[sym];
      if(v&&typeof v==="object"){
        for(const st of Object.keys(v))out.push({sym:String(sym).replace(/usdt$/i,"").toUpperCase(),st:st,a:num(v[st]),sh:NaN,dd:NaN});
      }else{
        out.push({sym:String(sym).replace(/usdt$/i,"").toUpperCase(),st:"OOS",a:num(v),sh:NaN,dd:NaN});
      }
    }
  }
  rows=out.slice(0,30).map(r=>
    "<tr><td>"+r.sym+"</td><td>"+r.st+"</td>"+
    '<td class="'+(r.a>=0?"g":"r")+'">'+(isNaN(r.a)?"-":r.a.toFixed(1)+"%")+"</td>"+
    "<td>"+(isNaN(r.sh)?"-":r.sh.toFixed(2))+"</td>"+
    "<td>"+(isNaN(r.dd)?"-":(Math.abs(r.dd)<=1?(r.dd*100):r.dd).toFixed(1)+"%")+"</td></tr>"
  ).join("");
  if(!out.length)console.error("diagnostic: aucun objet OOS reconnu dans",D);
}catch(e){console.error("extract error:",e.message)}
if(!rows){console.error("ABORT: zero ligne - digest.html non mis a jour");process.exit(2)}

const verdict=(bt&&(bt.honestVerdict||bt.verdict))||"";
const c=jr&&jr.carry;
const octLine=oct&&oct.signal
  ?"Octodamus: "+oct.signal.asset+" "+oct.signal.direction+" ("+oct.signal.timeframe+") \u2014 attribution api.octodamus.com \u00b7 <a href=\"/tools/market/octo\">endpoint</a>"
  :"indisponible";
const carLine=c
  ?"age "+(+c.ageHours||0).toFixed(1)+" h \u00b7 paper "+'<span class="'+(c.paperReturnPct>=c.buyHoldPct?"g":"r")+'">'+(+c.paperReturnPct).toFixed(3)+"%</span> vs buy&hold "+(+(c.buyHoldPct||0)).toFixed(3)+"%"
  :"rapport journalier a venir";

const html="<!doctype html><html lang=fr><head><meta charset=utf-8><title>Digest hebdo - micro-tools</title>\n"+
'<meta name=description content="Digest automatique: edge carry paper, verdicts backtest OOS, prochain FOMC, signal externe - SIMULATION ONLY">\n'+
'<link rel="alternate" type="application/rss+xml" title="micro-tools market feed" href="/feed.xml">\n'+
"<style>body{font-family:system-ui;background:#0b0e14;color:#e6e6e6;margin:2rem auto;max-width:720px;line-height:1.5}a{color:#60a5fa}\n"+
"h1{font-size:1.4rem}table{border-collapse:collapse;width:100%;margin:.8rem 0}td,th{border:1px solid #1e293b;padding:.35rem .55rem;font-size:.9rem;text-align:left}\n"+
'.g{color:#34d399}.r{color:#f87171}.mut{color:#94a3b8;font-size:.85rem}</style></head><body>\n'+
"<h1>Digest march\u00e9 hebdo \u2014 "+today+"</h1>\n"+
'<p class=mut>G\u00e9n\u00e9r\u00e9 automatiquement depuis mes artefacts publics \u00b7 <a href="/">micro-tools</a> \u00b7 <a href="/feed.xml">RSS</a></p>\n'+
"<h2>Macro</h2><p>Prochain FOMC cur\u00e9 (Fed): <strong>"+(fomc||"n/a")+"</strong>"+(days!=null?" \u2014 dans "+days+" j":"")+".</p>\n"+
"<h2>Carry paper (SIMULATION)</h2><p>"+carLine+"</p>\n"+
"<h2>Backtests IS/OOS (params canoniques, sans levier)</h2>\n"+
"<table><tr><th>Symbole</th><th>Strat\u00e9gie</th><th>OOS ann.</th><th>OOS sharpe</th><th>OOS maxDD</th></tr>"+rows+"</table>\n"+
(verdict?'<p class=mut><strong>Verdict:</strong> '+verdict+"</p>\n":"")+
"<h2>Signal externe</h2><p>"+octLine+"</p>\n"+
'<p class=mut>Tout ceci est SIMULATION ONLY \u2014 donn\u00e9es publiques Binance + sources officielles, pas un conseil financier.</p>\n'+
"</body></html>";

fs.writeFileSync(path.join(X,"public","digest.html"),html);
const n=(html.match(/<tr><td>[A-Z]/g)||[]).length;
console.log("digest.html ecrit,"+html.length+" octets,lignes donnees:"+n);
process.exit(n>0?0:2);
