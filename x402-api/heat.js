// micro-tools heat.svg backend - Binance public tickers, 60s in-process cache
'use strict';
const https=require('https');
const cache={t:0,data:null};
function fetchTickers(symbols,cb){
  const url='https://api.binance.com/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(symbols));
  const req=https.get(url,{timeout:8000},res=>{let b='';
    res.on('data',c=>b+=c);
    res.on('end',()=>{try{const j=JSON.parse(b);Array.isArray(j)?cb(null,j):cb(new Error('bad payload'));}catch(e){cb(e);}});
  });
  req.on('error',cb);req.on('timeout',()=>req.destroy(new Error('timeout')));
}
function getHeat(symbols,cb){
  if(cache.data&&Date.now()-cache.t<60000)return cb(null,cache.data);
  fetchTickers(symbols,(e,d)=>{if(e)return cb(e);cache.t=Date.now();cache.data=d;cb(null,d);});
}
module.exports={getHeat};
