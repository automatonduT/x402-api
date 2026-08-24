#!/usr/bin/env node
// gen-routes-doc.js - docs depuis le code: extrait les routes/prix de server.js
// et reecrit la section balisee du README entre <!-- ROUTES:START --> et <!-- ROUTES:END -->.
const fs=require("fs"),path=require("path");
const src=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
const readmeP=path.join(__dirname,"..","README.md");
const rows=[];
const re=/\.(get|post|put|delete)\(\s*["'`]([^"'`]+)["'`]/g;
let m;
while((m=re.exec(src))){
  const method=m[1].toUpperCase(), p=m[2];
  if(/^\/(public|assets)/.test(p)||p.includes(":"))continue;
  const tail=src.slice(m.index,m.index+500);
  const pm=tail.match(/price["']?\s*[:=]\s*["'`]?(0?\.\d+)/i);
  const cents=tail.match(/(\d{2,5})\s*\/?\s*(cents|100)/i);
  const price=pm?"$"+pm[1]:(cents?"$"+(parseInt(cents[1])/100):"free");
  if(!rows.some(r=>r.p===p))rows.push({p,m:method,price});
}
const table=["<!-- ROUTES:START -->","| Route | Method | Price |","|---|---|---|",
  ...rows.map(r=>`| \`${r.p}\` | ${r.m} | ${r.price} |`),
  "_Generated from server.js by tools/gen-routes-doc.js - never hand-edit._","<!-- ROUTES:END -->"].join("\n");
let md;
try{md=fs.readFileSync(readmeP,"utf8");}catch(e){md="# x402-api\n";}
if(/<!-- ROUTES:START -->[\s\S]*<!-- ROUTES:END -->/.test(md))
  md=md.replace(/<!-- ROUTES:START -->[\s\S]*<!-- ROUTES:END -->/,table);
else md+="\n## Routes\n\n"+table+"\n";
fs.writeFileSync(readmeP,md);
console.log("ROUTES_DOC=%d",rows.length);rows.forEach(r=>console.log(" ",r.m,r.p,r.price));
