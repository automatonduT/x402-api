#!/usr/bin/env node
/* micro-tools MCP server - exposes free micro-tools API as native MCP tools.
   Run: MICROTOOLS_BASE=https://forge-fax-acquired-second.trycloudflare.com node server.js
   No dependencies. Stdio JSON-RPC (MCP 2024-11-05 subset: initialize/tools). */
const BASE=(process.env.MICROTOOLS_BASE||"https://forge-fax-acquired-second.trycloudflare.com").replace(/\/+$/,"");
const TOOLS={
 uuid:{desc:"Generate UUIDv4s",schema:{type:"object",properties:{n:{type:"number",description:"count 1-100"}},required:[]},path:a=>"/tools/uuid?n="+Math.min(Math.max(a.n||3,1),100)},
 hash:{desc:"SHA-256/SHA-1 hash of text",schema:{type:"object",properties:{data:{type:"string"},algo:{type:"string",enum:["sha256","sha1"]}},required:["data"]},path:a=>"/tools/hash?data="+encodeURIComponent(String(a.data).slice(0,500))+"&algo="+(a.algo==="sha1"?"sha1":"sha256")},
 base64e:{desc:"Base64-encode text",schema:{type:"object",properties:{text:{type:"string"}},required:["text"]},path:a=>"/tools/base64?mode=e&text="+encodeURIComponent(String(a.text).slice(0,2000))},
 base64d:{desc:"Decode base64 text",schema:{type:"object",properties:{text:{type:"string"}},required:["text"]},path:a=>"/tools/base64?mode=d&text="+encodeURIComponent(String(a.text).slice(0,2000))},
 json_format:{desc:"Pretty-print/format JSON string",schema:{type:"object",properties:{json:{type:"string"}},required:["json"]},path:a=>null,post:a=>["/tools/json/format",{json:String(a.json).slice(0,20000)}]},
 csv2json:{desc:"Convert CSV to JSON array (RFC4180 quoted fields)",schema:{type:"object",properties:{csv:{type:"string"}},required:["csv"]},path:null,post:a=>["/tools/csv2json",{csv:String(a.csv).slice(0,20000)}]},
 slugify:{desc:"URL-slugify text",schema:{type:"object",properties:{text:{type:"string"}},required:["text"]},path:a=>"/tools/slugify?text="+encodeURIComponent(String(a.text).slice(0,300))},
 time:{desc:"Current UTC time (ISO+epoch)",schema:{type:"object",properties:{}},path:()=>"/tools/time"},
 cron_next:{desc:"Next N fire times of a cron expression",schema:{type:"object",properties:{expr:{type:"string"},n:{type:"number"}},required:["expr"]},path:a=>"/tools/cron/next?expr="+encodeURIComponent(String(a.expr).slice(0,60))+"&n="+Math.min(a.n||3,10)},
 market_quote:{desc:"Live crypto spot quote (Binance): price + 24h change. SIM data source",schema:{type:"object",properties:{symbol:{type:"string",description:"e.g. BTCUSDT"}},required:["symbol"]},path:a=>"/tools/market/quote?symbol="+encodeURIComponent(String(a.symbol||"BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12))},
 market_signal:{desc:"Trading signal SIMULATION ONLY (momentum or meanrev) with entry/stop/target from Binance history",schema:{type:"object",properties:{symbol:{type:"string"},kind:{type:"string",enum:["momentum","meanrev"]}},required:["symbol"]},path:a=>"/tools/market/signal?kind="+(a.kind==="meanrev"?"meanrev":"momentum")+"&symbol="+encodeURIComponent(String(a.symbol||"BTCUSDT").toUpperCase())},
 correlation:{desc:"Pearson correlation matrix of daily returns across pairs + most-diversifying hint",schema:{type:"object",properties:{symbols:{type:"string",description:"CSV e.g. BTCUSDT,ETHUSDT,SOLUSDT"},days:{type:"number"}},required:["symbols"]},path:a=>"/tools/market/correlation?symbols="+encodeURIComponent(String(a.symbols))+"&days="+Math.min(Math.max(a.days||30,7),90)},
 riskparity:{desc:"Inverse-volatility portfolio weights from real daily returns",schema:{type:"object",properties:{symbols:{type:"string"},days:{type:"number"}},required:["symbols"]},path:a=>"/tools/market/riskparity?symbols="+encodeURIComponent(String(a.symbols))+"&days="+Math.min(Math.max(a.days||60,14),180)},
 sim_portfolio:{desc:"What-if backtest: equity/CAGR/vol/maxDrawdown for given weights vs equal-weight. SIMULATION ONLY",schema:{type:"object",properties:{weights:{type:"object",description:'{"BTCUSDT":0.5,"ETHUSDT":0.5} sums to 1'},days:{type:"number"}},required:["weights"]},path:null,post:a=>["/tools/market/sim-portfolio",{weights:a.weights||{},days:Math.min(Math.max(a.days||90,30),365)}]}
};
async function call(name,args){const t=TOOLS[name];if(!t)throw new Error("unknown tool");
 const safe=async r=>{const txt=await r.text();try{return JSON.parse(txt);}catch(e){return {httpStatus:r.status,note:"non-JSON response (gateway/tunnel)",bodyPreview:txt.replace(/\s+/g," ").slice(0,200)};}};
 if(t.post){const[u,b]=t.post(args||{});const r=await fetch(BASE+u,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b),signal:AbortSignal.timeout(15000)});return safe(r);}
 const r=await fetch(BASE+t.path(args||{}),{signal:AbortSignal.timeout(15000)});return safe(r);
}
let buf="";
process.stdin.setEncoding("utf8");
process.stdin.on("data",d=>{buf+=d;let i;while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(line)handle(line);}});
function send(o){process.stdout.write(JSON.stringify(o)+"\n");}
function handle(line){let m;try{m=JSON.parse(line);}catch(e){return;}
 if(m.method==="initialize")send({jsonrpc:"2.0",id:m.id,result:{protocolVersion:"2024-11-05",capabilities:{tools:{}},serverInfo:{name:"micro-tools",version:"1.11.1"}}});
 else if(m.method==="tools/list")send({jsonrpc:"2.0",id:m.id,result:{tools:Object.entries(TOOLS).map(([n,t])=>({name:n,description:t.desc,inputSchema:t.schema}))}});
 else if(m.method==="tools/call"){const{name,arguments:a}=m.params||{};
  call(name,a).then(res=>send({jsonrpc:"2.0",id:m.id,result:{content:[{type:"text",text:typeof res==="string"?res:JSON.stringify(res)}]}}))
   .catch(e=>send({jsonrpc:"2.0",id:m.id,error:{code:-32000,message:String(e&&e.message||e).slice(0,120)}}));}
 // notifications: no response
}
