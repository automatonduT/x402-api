#!/usr/bin/env node
// zyfai-catalog.js - client MCP complet (SSE) pour cataloguer mcp.zyf.ai [item 6]
const URL="https://mcp.zyf.ai/mcp";
let SESSION=null;
async function rpc(body){
  const h={"Content-Type":"application/json","Accept":"application/json, text/event-stream"};
  if(SESSION)h["Mcp-Session-Id"]=SESSION;
  const r=await fetch(URL,{method:"POST",headers:h,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const sid=r.headers.get("mcp-session-id");if(sid)SESSION=sid;
  const t=await r.text();
  const m=/^data:\s*(.+)$/m.exec(t);           // ligne "data:" du flux SSE
  if(!m)throw new Error("pas de payload SSE (http "+r.status+"): "+t.slice(0,120));
  return JSON.parse(m[1]);
}
(async()=>{
  const init=await rpc({jsonrpc:"2.0",id:1,method:"initialize",
    params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"alpha-probe",version:"1.0"}}});
  console.log("serveur:",init.result?.serverInfo?.name,init.result?.serverInfo?.version);
  await rpc({jsonrpc:"2.0",method:"notifications/initialized"}).catch(()=>{});
  const list=await rpc({jsonrpc:"2.0",id:2,method:"tools/list"});
  const tools=(list.result?.tools||[]).map(t=>({name:t.name,
    description:(t.description||"").slice(0,200),
    args:Object.keys(t.inputSchema?.properties||{})}));
  require("fs").writeFileSync(__dirname+"/../zyfai-catalog.json",
    JSON.stringify({probedAt:new Date().toISOString(),server:init.result?.serverInfo,count:tools.length,tools},null,1));
  console.log("outils:",tools.length);
  for(const t of tools)console.log(" -",t.name,"|",t.description.slice(0,90),"| args:",t.args.join(","));
})().catch(e=>{console.error("ECHEC:",e.message);process.exit(1)});
