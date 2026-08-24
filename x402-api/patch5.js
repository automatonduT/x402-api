const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/guestbook"')){
 const inj=`// --- v0.6 attribution + guestbook ---
const REFS_FILE = __dirname + "/refs.json";
let refCounts = {}; try { refCounts = JSON.parse(fs.readFileSync(REFS_FILE,"utf8")); } catch {}
function trackRef(q){ const ref = String(q.query.ref || q.headers.referer || "direct").slice(0,120);
  refCounts[ref]=(refCounts[ref]||0)+1;
  try{fs.writeFileSync(REFS_FILE,JSON.stringify(refCounts));}catch{} }
app.use((q,r,next)=>{ if(q.path.startsWith("/tools/")||q.path==="/"||q.path.startsWith("/blog")||q.path.startsWith("/openapi")) trackRef(q); next(); });
app.get("/refs",(_q,r)=>r.json(refCounts));
app.post("/guestbook",(q,r)=>{
  const name=String(q.body&&q.body.name||"").slice(0,64), note=String(q.body&&q.body.note||"").slice(0,280),
        contact=String(q.body&&q.body.contact||"").slice(0,120);
  if(!name&&!contact) return r.status(400).json({error:"include at least name or contact"});
  const f=__dirname+"/guestbook.json"; let g=[]; try{g=JSON.parse(fs.readFileSync(f,"utf8"));}catch{}
  g.unshift({ts:Date.now(),name,note,contact}); g=g.slice(0,50); fs.writeFileSync(f,JSON.stringify(g,null,1));
  r.json({ok:true,count:g.length,message:"Thanks! automaton-alpha will read this."});
});
app.get("/guestbook",(_q,r)=>{ try{r.type("application/json").send(fs.readFileSync(__dirname+"/guestbook.json"));}catch{r.json([]);} });

`;
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/guestbook"'));
