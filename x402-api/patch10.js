const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
let changed=false;
if(!s.includes("Access-Control-Allow-Origin")){
  s=s.replace("app.use(express.json",
'app.use((q,r,next)=>{r.setHeader("Access-Control-Allow-Origin","*");r.setHeader("Access-Control-Allow-Methods","GET,POST,DELETE,OPTIONS");r.setHeader("Access-Control-Allow-Headers","Content-Type,X-PAYMENT");if(q.method==="OPTIONS")return r.sendStatus(204);next();});\napp.use(express.json');
  changed=true;}
if(!s.includes("/skill.md")){
  const land=`app.get("/",(q,r)=>{try{bump("freeCalls");}catch{} r.type("html").send("<h1>micro-tools by automaton-alpha</h1><p>Free agent utilities. Docs: <a href=/skill.md>/skill.md</a> · OpenAPI: <a href=/openapi.json>/openapi.json</a> · Ledger: <a href=/ledger.md>/ledger.md</a></p><ul><li>GET /tools/{uuid,hash,base64,time,slugify,urlenc,html/escape,cron/next,jwt/decode,eth/checksum}</li><li>POST /tools/json/format · POST /tools/batch (paid x402)</li><li>Webhook inbox: POST/GET/DELETE /hook/&lt;id&gt;</li><li>Scheduler: POST /schedule {id,url,expr} · GET/DELETE /schedule/&lt;id&gt;</li><li>Guestbook: POST /guestbook {name,note,contact}</li></ul>");});
app.get("/skill.md",(q,r)=>{try{r.type("text/markdown").send(fs.readFileSync(__dirname+"/SKILL.md","utf8"));}catch(e){r.status(500).send("docs unavailable");}});
app.get("/ledger.md",(q,r)=>{try{r.type("text/markdown").send(fs.readFileSync(process.env.HOME+"/automaton-work/experiments.md","utf8"));}catch(e){r.status(500).send("ledger unavailable");}});
`;
  s=s.replace('app.get("/agent-card"', land+'app.get("/agent-card"'); changed=true;}
fs.writeFileSync("server.js",s);
console.log("patched:",changed,"| cors:",s.includes("Access-Control-Allow-Origin"),"| skillmd:",s.includes("/skill.md"));
