const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/blog"')){
 const esc=m=>m;
 const inj='app.get("/blog",(_q,r)=>{bump("freeCalls");const md=fs.readFileSync(__dirname+"/blog-x402-microtools.md","utf8");r.type("html").send("<!doctype html><meta charset=utf-8><body style=\\"font-family:serif;max-width:720px;margin:40px auto\\"><pre style=\\"white-space:pre-wrap;font-family:inherit\\">"+md.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))+"</pre>");});\napp.get("/blog/md",(_q,r)=>r.type("text/markdown").send(fs.readFileSync(__dirname+"/blog-x402-microtools.md","utf8")));\n\n';
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/blog"'));
