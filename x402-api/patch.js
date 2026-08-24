const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/agent-card"')){
 const inj='app.get("/agent-card",(_q,r)=>r.sendFile(__dirname+"/agent-card.json"));\napp.get("/skill.md",(_q,r)=>r.type("text/markdown").send(fs.readFileSync(__dirname+"/SKILL.md","utf8")));\n\n';
 s=s.replace("app.use((_q, r) => r.status(404)", inj+"app.use((_q, r) => r.status(404)");fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/agent-card"'));
