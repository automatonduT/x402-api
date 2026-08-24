// equity-svg.js v1: renders cumulative paper-trading equity curve as SVG from ledger rows.
// Row formats handled: | PAPER | <iso> | SYM kind: SIDE entry=N ... | ... | verdict=X ... |
// pnl taken from verdict=(WIN|LOSS) [+-]N.NN% ; CLOSED-NO-TRADE/PENDING => flat contribution.
const fs = require("fs"), path = require("path");
function buildEquitySvg(){
  const LEDGER = path.join(__dirname,"..","experiments.md");
  let txt=""; try{ txt=fs.readFileSync(LEDGER,"utf8"); }catch(e){ return null; }
  const pts=[100]; let wins=0,losses=0,noTrade=0;
  for(const line of txt.split("\n")){
    if(!line.includes("| PAPER |")) continue;
    const m=line.match(/verdict=(WIN|LOSS|CLOSED-NO-TRADE|PENDING)/);
    const p=line.match(/verdict=(?:WIN|LOSS)\s*([+-]?[\d.]+)%/);
    if(m&&m[1]==="CLOSED-NO-TRADE"){noTrade++;pts.push(pts[pts.length-1]);continue;}
    if(m&&m[1]==="PENDING")continue;
    if(p){const pnl=parseFloat(p[1]);pnl>=0?wins++:losses++;pts.push(+(pts[pts.length-1]*(1+pnl/100)).toFixed(2));}
    else pts.push(pts[pts.length-1]);
  }
  const W=800,H=280,PAD=34, n=pts.length;
  const min=Math.min(...pts), max=Math.max(...pts);
  const span=(max-min)||1;
  const X=i=>n<=1?PAD+i*2:PAD+(i*(W-2*PAD))/(n-1);
  const Y=v=>H-PAD-((v-min)*(H-2*PAD))/span;
  const poly=pts.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const up=pts[n-1]>=100, col=up?"#22c55e":"#ef4444";
  const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
   +`<rect width="${W}" height="${H}" fill="#0b1220"/>`
   +[0,.25,.5,.75,1].map(f=>{const y=PAD+f*(H-2*PAD);const val=(max-f*span).toFixed(1);
     return `<line x1="${PAD}" y1="${y.toFixed(1)}" x2="${W-PAD}" y2="${y.toFixed(1)}" stroke="#1e293b"/><text x="6" y="${(y+4).toFixed(1)}" fill="#475569" font-size="10">${esc(val)}</text>`;}).join("")
   +`<polyline points="${poly}" fill="none" stroke="${col}" stroke-width="2"/>`
   +`<circle cx="${X(n-1).toFixed(1)}" cy="${Y(pts[n-1]).toFixed(1)}" r="3.5" fill="${col}"/>`
   +`<text x="${PAD}" y="20" fill="#e2e8f0" font-family="monospace" font-size="13">paper-trading equity (SIMULATION ONLY)</text>`
   +`<text x="${W-PAD}" y="20" fill="${col}" font-family="monospace" font-size="13" text-anchor="end">${pts[n-1]} (${up?"+":""}${(pts[n-1]-100).toFixed(1)})</text>`
   +`<text x="${PAD}" y="${H-8}" fill="#64748b" font-size="11">closed ${wins}W/${losses}L · no-trade ${noTrade} · start=100</text>`
   +`<a href="https://completely-contrast-corporations-decorative.trycloudflare.com"><text x="${W-PAD}" y="${H-8}" fill="#38bdf8" font-size="11" text-anchor="end">by automaton-alpha →</text></a></svg>`;
}
module.exports={buildEquitySvg};
