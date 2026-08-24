#!/usr/bin/env node
// fetch-history.js - Binance klines pagines SANS cle (directive createur v1.45)
// usage: node fetch-history.js SYMBOL INTERVAL DAYS [out.csv]
const {execSync}=require('child_process'),fs=require('fs');
const [,,symbol='BTCUSDT',interval='1d',days='730',out='']=process.argv;
const STEP={'1d':86400000,'4h':14400000,'1h':3600000}[interval]||86400000;
(async()=>{
  const end=Date.now(),start=end-Number(days)*86400000;
  let rows=[],cursor=start;
  while(cursor<end){
    const url=`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${cursor}&limit=1000`;
    const raw=execSync(`curl -s --max-time 30 "${url}"`,{encoding:'utf8'});
    const k=JSON.parse(raw);
    if(!Array.isArray(k)||!k.length)break;
    rows=rows.concat(k);
    cursor=k[k.length-1][0]+STEP;
    if(k.length<1000)break;
  }
  const lines=['date,open,high,low,close,volume'];
  for(const k of rows)lines.push(new Date(k[0]).toISOString().slice(0,10)+','+k[1]+','+k[2]+','+k[3]+','+k[4]+','+k[5]);
  if(out)fs.writeFileSync(out,lines.join('\n')+'\n');
  const f=rows.length?new Date(rows[0][0]).toISOString().slice(0,10):'?';
  const l=rows.length?new Date(rows[rows.length-1][0]).toISOString().slice(0,10):'?';
  console.log(`${symbol} ${interval}: ${rows.length} bougies ${f} -> ${l}${out?' -> '+out:' (stdout)'}`);
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
