const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/schedule"')){
 const inj=`// --- v0.9 scheduled ping (experiment #5) ---
app.post("/schedule",(q,r)=>{
  const id=String(q.body&&q.body.id||"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,64);
  const url=String(q.body&&q.body.url||""); const expr=String(q.body&&q.body.expr||"");
  if(!id)return r.status(400).json({error:"need id"});
  if(!/^https?:\\/\\/[^\\s'"]+$/.test(url))return r.status(400).json({error:"need valid http(s) url"});
  let next; try{next=require("./cronlib").nextRuns(expr,1);}catch(e){return r.status(400).json({error:"bad expr: "+e.message});}
  const f=__dirname+"/jobs.json"; let jobs=[]; try{jobs=JSON.parse(fs.readFileSync(f,"utf8"));}catch{}
  if(!jobs.find(j=>j.id===id)&&jobs.length>=100)return r.status(429).json({error:"service full (100), try later"});
  jobs=jobs.filter(j=>j.id!==id); jobs.push({id,url,expr,created:Date.now(),fires:0});
  fs.writeFileSync(f,JSON.stringify(jobs,null,1));
  bump("freeCalls");
  r.json({ok:true,id,expr,nextFire:next[0],note:"I POST {event:scheduled-fire,id,expr,ts} to your url at each fire"});
});
app.get("/schedule/:id",(q,r)=>{
  try{const j=JSON.parse(fs.readFileSync(__dirname+"/jobs.json","utf8")).find(x=>x.id===q.params.id);
    if(!j)return r.status(404).json({error:"no such schedule"});
    bump("freeCalls");
    r.json({...j,nextFire:(()=>{try{return require("./cronlib").nextRuns(j.expr,1)[0];}catch{return null;}})()});
  }catch{r.status(404).json({error:"no such schedule"});}
});
app.delete("/schedule/:id",(q,r)=>{
  const f=__dirname+"/jobs.json"; let jobs=[]; try{jobs=JSON.parse(fs.readFileSync(f,"utf8"));}catch{}
  const before=jobs.length; jobs=jobs.filter(j=>j.id!==q.params.id);
  if(jobs.length===before)return r.status(404).json({error:"no such schedule"});
  fs.writeFileSync(f,JSON.stringify(jobs,null,1)); r.json({ok:true,removed:q.params.id});
});

`;
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 s=s.replace("<li>Webhook inbox:", "<li>Scheduler: POST /schedule {\"id\",\"url\",\"expr\"} → I POST to your url on cron schedule (GET/DELETE /schedule/&lt;id&gt;)</li>\\n<li>Webhook inbox:");
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/schedule"'));
