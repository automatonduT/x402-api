#!/usr/bin/env node
// micro-tools MCP server v2 - zero-dependency, stdio JSON-RPC. 17 tools.
// Install: curl -O <base>/mcp-server.js && MICROTOOLS_BASE=<base> node mcp-server.js
const BASE=(process.env.MICROTOOLS_BASE||"https://completely-contrast-corporations-decorative.trycloudflare.com").replace(/\/+$/,"");
const https=require("https");
function req(method,u,body){return new Promise((res,rej)=>{
 const data=body?JSON.stringify(body):null;
 const r=https.request(u,{method,headers:Object.assign({accept:"application/json"},data?{"content-type":"application/json","content-length":Buffer.byteLength(data)}:{})},x=>{
  let d="";x.on("data",c=>d+=c);x.on("end",()=>{try{res(JSON.parse(d));}catch(e){rej(new Error("bad json: "+d.slice(0,80)));}});});
 r.on("error",rej);r.setTimeout(15000,()=>r.destroy(new Error("timeout")));
 if(data)r.write(data);r.end();});}
const S={type:"object",properties:{},required:[]};
const TOOLS=[
 {name:"uuid",desc:"Generate UUIDs",inputSchema:{type:"object",properties:{n:{type:"number",description:"count, default 5"}}}},
 {name:"hash",desc:"Hash text (sha256/sha1/md5)",inputSchema:{type:"object",properties:{data:{type:"string"},algo:{type:"string",enum:["sha256","sha1","md5"]}},required:["data"]}},
 {name:"base64",desc:"Base64 encode/decode",inputSchema:{type:"object",properties:{text:{type:"string"},mode:{type:"string",enum:["e","d"]}},required:["text"]}},
 {name:"json_format",desc:"Format/minify JSON",inputSchema:{type:"object",properties:{json:{type:"string"},indent:{type:"number"}},required:["json"]}},
 {name:"json2csv",desc:"Convert JSON rows to CSV",inputSchema:{type:"object",properties:{rows:{type:"string",description:"JSON array of objects"}},required:["rows"]}},
 {name:"csv2json",desc:"Convert CSV to JSON (RFC4180 quoted fields)",inputSchema:{type:"object",properties:{csv:{type:"string"}},required:["csv"]}},
 {name:"slugify",desc:"URL-slugify text",inputSchema:{type:"object",properties:{text:{type:"string"}},required:["text"]}},
 {name:"time",desc:"Current UTC time + epoch",inputSchema:S},
 {name:"cron_next",desc:"Next N fire times of a cron expression",inputSchema:{type:"object",properties:{expr:{type:"string"},n:{type:"number"}},required:["expr"]}},
 {name:"quote",desc:"Live Binance ticker quote",inputSchema:{type:"object",properties:{symbol:{type:"string",description:"e.g. BTCUSDT"}},required:["symbol"]}},
 {name:"signal",desc:"Paper trading signal (momentum/meanrev) w/ entry/stop/target",inputSchema:{type:"object",properties:{kind:{type:"string",enum:["momentum","meanrev"]},symbol:{type:"string"}},required:["kind","symbol"]}},
 {name:"correlation",desc:"Pearson correlation matrix across symbols",inputSchema:{type:"object",properties:{symbols:{type:"string",description:"comma list"}},required:["symbols"]}},
 {name:"riskparity",desc:"Risk-parity weights from correlation",inputSchema:{type:"object",properties:{symbols:{type:"string"}},required:["symbols"]}},
 {name:"sim_portfolio",desc:"Backtest a weighted portfolio vs equal-weight (SIM)",inputSchema:{type:"object",properties:{weights:{type:"string",description:'JSON obj e.g. {"BTCUSDT":0.5,"ETHUSDT":0.5}'},days:{type:"number"}},required:["weights"]}},
 {name:"regime",desc:"Live regime matrix per pair: ADX14(1h), BB-squeeze, funding+HOT, systems ON",inputSchema:{type:"object",properties:{symbols:{type:"string",description:"comma list, max 6"}}}},
 {name:"journal",desc:"Execution-quality journal per paper system: closed, winRate, avg MFE/MAE, capture ratio",inputSchema:S},
 {name:"desk",desc:"One-call snapshot of the whole paper-trading desk: open book counts + execution journal + live regime matrix",inputSchema:S}
];
async function call(name,a){a=a||{};const q=o=>Object.entries(o).filter(([,v])=>v!=null).map(([k,v])=>k+"="+encodeURIComponent(v)).join("&");
 switch(name){
  case "uuid":return req("GET",BASE+"/tools/uuid?"+q({n:a.n||5}));
  case "hash":return req("GET",BASE+"/tools/hash?"+q({data:a.data,algo:a.algo||"sha256"}));
  case "base64":return req("GET",BASE+"/tools/base64?"+q({text:a.text,mode:a.mode||"e"}));
  case "json_format":return req("POST",BASE+"/tools/json/format",{json:JSON.parse(a.json),indent:a.indent});
  case "json2csv":return req("POST",BASE+"/tools/json2csv",{rows:JSON.parse(a.rows)});
  case "csv2json":return req("POST",BASE+"/tools/csv2json",{csv:a.csv});
  case "slugify":return req("GET",BASE+"/tools/slugify?"+q({text:a.text}));
  case "time":return req("GET",BASE+"/tools/time");
  case "cron_next":return req("GET",BASE+"/tools/cron/next?"+q({expr:a.expr,n:a.n||3}));
  case "quote":return req("GET",BASE+"/tools/market/quote?"+q({symbol:a.symbol}));
  case "signal":return req("GET",BASE+"/tools/market/signal?"+q({kind:a.kind,symbol:a.symbol}));
  case "correlation":return req("GET",BASE+"/tools/market/correlation?"+q({symbols:a.symbols}));
  case "riskparity":return req("GET",BASE+"/tools/market/riskparity?"+q({symbols:a.symbols}));
  case "sim_portfolio":return req("POST",BASE+"/tools/market/sim-portfolio",{weights:JSON.parse(a.weights),days:a.days||90});
  case "regime":return req("GET",BASE+"/tools/market/regime?"+q({symbols:a.symbols||"BTCUSDT,ETHUSDT,SOLUSDT"}));
  case "journal":return req("GET",BASE+"/tools/market/journal");
  case "desk":return req("GET",BASE+"/tools/market/desk");
  default:throw new Error("unknown tool: "+name);}}
let buf="";
process.stdin.on("data",c=>{buf+=c;let i;
 while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);
  if(!line)continue;let m;try{m=JSON.parse(line);}catch(e){continue;}
  if(m.jsonrpc!=="2.0"||m.id==null)continue; // notifications ignored
  (async()=>{pending++;
   try{
    if(m.method==="initialize")return send(m.id,{protocolVersion:"2024-11-05",capabilities:{tools:{}},serverInfo:{name:"micro-tools",version:"2.0.0"}});
    if(m.method==="tools/list")return send(m.id,{tools:TOOLS});
    if(m.method==="tools/call"){const r=await call(m.params.name,m.params.arguments);
     return send(m.id,{content:[{type:"text",text:JSON.stringify(r)}]});}
    return send(m.id,{error:{code:-32601,message:"method not found"}});
   }catch(e){send(m.id,{error:{code:-32000,message:String(e.message||e)}});}
   finally{pending--;}
  })();}});
function send(id,result){process.stdout.write(JSON.stringify({jsonrpc:"2.0",id,result})+"\n");}
let pending=0;
process.stdin.on("end",()=>{const chk=setInterval(()=>{if(pending===0){clearInterval(chk);process.exit(0);}},50);});
