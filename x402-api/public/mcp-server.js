#!/usr/bin/env node
// mcp-server.js v2 - zero-dependency MCP (stdio) bridge to micro-tools API [v1.83]
// Usage: MICROTOOLS_BASE=<base> node mcp-server.js
const BASE=(process.env.MICROTOOLS_BASE||"https://album-powerful-pursue-bronze.trycloudflare.com").replace(/\/$/,"");
const j=async(p,opt)=>{const r=await fetch(BASE+p,{signal:AbortSignal.timeout(15000),...opt});const t=await r.text();try{return JSON.parse(t)}catch(e){return {raw:t.slice(0,500),status:r.status}}};
const TOOLS=[
 {name:"health",description:"Liveness check of micro-tools API",inputSchema:{type:"object",properties:{}},call:()=>j("/health")},
 {name:"time",description:"Current UTC time (iso/unix)",inputSchema:{type:"object",properties:{}},call:()=>j("/tools/time")},
 {name:"uuid",description:"Generate UUIDs",inputSchema:{type:"object",properties:{n:{type:"integer"}}},call:a=>j("/tools/uuid?n="+Math.min(a.n||1,100))},
 {name:"hash",description:"Hash text (sha256/sha1/md5)",inputSchema:{type:"object",properties:{data:{type:"string"},algo:{type:"string"}},required:["data"]},call:a=>j("/tools/hash?data="+encodeURIComponent(a.data)+"&algo="+(a.algo||"sha256"))},
 {name:"base64",description:"Base64 encode/decode (mode e|d)",inputSchema:{type:"object",properties:{text:{type:"string"},mode:{type:"string",enum:["e","d"]}},required:["text"]},call:a=>j("/tools/base64?text="+encodeURIComponent(a.text)+"&mode="+(a.mode||"e"))},
 {name:"slugify",description:"URL slug from text",inputSchema:{type:"object",properties:{text:{type:"string"}},required:["text"]},call:a=>j("/tools/slugify?text="+encodeURIComponent(a.text))},
 {name:"json2csv",description:"Convert rows [{col:val}] to CSV",inputSchema:{type:"object",properties:{rows:{type:"array"}},required:["rows"]},call:a=>j("/tools/json2csv",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows:a.rows})})},
 {name:"csv2json",description:"Convert CSV string to rows",inputSchema:{type:"object",properties:{csv:{type:"string"}},required:["csv"]},call:a=>j("/tools/csv2json",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv:a.csv})})},
 {name:"jwt_decode",description:"Decode JWT header+payload (no verify)",inputSchema:{type:"object",properties:{token:{type:"string"}},required:["token"]},call:a=>j("/tools/jwt/decode?token="+encodeURIComponent(a.token))},
 {name:"market_macro",description:"Next FOMC & CPI release dates (official Fed/BLS baseline) - event risk watch",inputSchema:{type:"object",properties:{}},call:()=>j("/tools/market/macro")},
{name:"market_octo",description:"Latest external AI signal from Octodamus (30min cache, attribution) - SIMULATION ONLY",inputSchema:{type:"object",properties:{}},call:()=>j("/tools/market/octo")},
{name:"market_funding",description:"Live perp funding rates + carry eligibility (SIM)",inputSchema:{type:"object",properties:{symbols:{type:"string"}}},call:a=>j("/tools/tradelab/funding?symbols="+encodeURIComponent(a.symbols||"BTCUSDT,ETHUSDT,SOLUSDT"))},
{name:"market_rsi",description:"RSI snapshot + sparkline for symbol (SIM)",inputSchema:{type:"object",properties:{symbol:{type:"string"},interval:{type:"string"}},required:["symbol"]},call:a=>j("/tools/market/rsi?symbol="+encodeURIComponent(a.symbol)+"&interval="+(a.interval||"1d"))},
 {name:"market_regime",description:"Trend/volatility regime per symbols (SIM)",inputSchema:{type:"object",properties:{symbols:{type:"string"}},required:["symbols"]},call:a=>j("/tools/market/regime?symbols="+encodeURIComponent(a.symbols))},
 {name:"market_positions",description:"Paper portfolio returns (SIM)",inputSchema:{type:"object",properties:{symbols:{type:"string"},days:{type:"integer"}}},call:a=>j("/tools/market/positions?symbols="+encodeURIComponent(a.symbols||"BTCUSDT,ETHUSDT,SOLUSDT")+"&days="+(a.days||30))},
 {name:"market_desk",description:"ONE-CALL trading desk snapshot: regime+positions+alerts+journal (SIM)",inputSchema:{type:"object",properties:{symbols:{type:"string"}}},call:a=>j("/tools/market/desk?symbols="+encodeURIComponent(a.symbols||"BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT"))},
 {name:"market_alert_create",description:"Create price alert w/ signed webhook callback (SIM)",inputSchema:{type:"object",properties:{symbol:{type:"string"},op:{type:"string",enum:[">","<"]},price:{type:"number"},url:{type:"string"},secret:{type:"string"}},required:["symbol","op","price","url"]},call:a=>j("/tools/market/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})},
 {name:"market_alert_list",description:"List active alerts",inputSchema:{type:"object",properties:{}},call:()=>j("/tools/market/alerts")},
 {name:"hook_receive_info",description:"Inspect events received on /hook/<id>",inputSchema:{type:"object",properties:{id:{type:"string"}},required:["id"]},call:a=>j("/hook/"+a.id)},
 {name:"schedule_create",description:"Recurring HTTP ping every >=5min while server runs",inputSchema:{type:"object",properties:{id:{type:"string"},url:{type:"string"},expr:{type:"string"}},required:["id","url"]},call:a=>j("/schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})},
 {name:"monitor_create",description:"Uptime monitor (5min poll) + public status page /m/<id>",inputSchema:{type:"object",properties:{url:{type:"string"}},required:["url"]},call:a=>j("/monitor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})},
 {name:"rss_watch",description:"Poll RSS feed, POST new items to your webhook",inputSchema:{type:"object",properties:{feed:{type:"string"},url:{type:"string"}},required:["feed","url"]},call:a=>j("/rss-watch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})},
 {name:"guestbook_post",description:"Sign the public guestbook",inputSchema:{type:"object",properties:{from:{type:"string"},message:{type:"string"}},required:["message"]},call:a=>j("/guestbook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})}
];
let buf="";
process.stdin.setEncoding("utf8");
process.stdin.on("data",d=>{buf+=d;let i;while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(line)handle(line);}});
async function handle(line){
  let msg;try{msg=JSON.parse(line)}catch(e){return}
  const id=msg.id??null;
  const reply=res=>process.stdout.write(JSON.stringify({jsonrpc:"2.0",id,result:res})+"\n");
  if(msg.method==="initialize")return reply({protocolVersion:"2024-11-05",capabilities:{tools:{}},serverInfo:{name:"micro-tools",version:"1.83"}});
  if(msg.method==="notifications/initialized")return;
  if(msg.method==="tools/list")return reply({tools:TOOLS.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema}))});
  if(msg.method==="tools/call"){
    const t=TOOLS.find(x=>x.name===msg.params?.name);
    if(!t)return reply({content:[{type:"text",text:"unknown tool"}],isError:true});
    try{const out=await t.call(msg.params.arguments||{});
      return reply({content:[{type:"text",text:JSON.stringify(out,null,1)}]});
    }catch(e){return reply({content:[{type:"text",text:"error: "+e.message}],isError:true})}
  }
  if(msg.method==="ping")return reply({});
}
