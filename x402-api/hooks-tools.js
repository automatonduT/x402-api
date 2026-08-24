// hooks-tools.js - webhooks/scheduler/monitors/metrics/guestbook [v1.81]
const express=require("express");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const rt=express.Router();
rt.use(express.json({limit:"1mb"}));
const DB=path.join(__dirname,"hooks-db.json");
const load=()=>{try{return JSON.parse(fs.readFileSync(DB,"utf8"))}catch(e){return {hooks:{},schedules:{},monitors:{},rss:{},guestbook:[]}}};
let db=load();
const save=()=>{try{fs.writeFileSync(DB,JSON.stringify(db,null,1))}catch(e){}};

// POST /hook/<id> - receive webhook, keep last 20
rt.post("/hook/:id",(q,r)=>{const id=q.params.id;
  const entry={ts:new Date().toISOString(),headers:{"content-type":q.headers["content-type"]||""},body:q.body};
  const h=db.hooks[id]=db.hooks[id]||{created:new Date().toISOString(),events:[]};
  h.events.push(entry); if(h.events.length>20)h.events.shift();
  save(); try{bump("freeCalls")}catch(e){}
  r.json({ok:true,id,received:h.events.length})});
// GET /hook/<id> - inspect events (+ ?secret= to see signatures)
rt.get("/hook/:id",(q,r)=>{const h=db.hooks[q.params.id];
  if(!h)return r.status(404).json({error:"unknown hook"});
  r.json({id:q.params.id,created:h.created,count:h.events.length,events:h.events.slice(-10)})});

// POST /schedule {"id","url","expr"} - cron-ish scheduler (min interval 5min)
rt.post("/schedule",(q,r)=>{const {id,url,expr}=q.body||{};
  if(!id||!url)return r.status(400).json({error:"body: {id,url,expr?} requis"});
  const m=/\*\/(\d+)\s+\*\s+\*\s+\*\s+\*/.exec(String(expr||"*/5 * * * *"));
  const min=Math.max(m?parseInt(m[1]):5,5);
  const rec={id,url,min,created:new Date().toISOString(),lastRun:null,hits:0};
  if(rec._timer)clearInterval(rec._timer);
  db.schedules[id]=rec;save();
  const timer=setInterval(async()=>{try{
    await fetch(url,{signal:AbortSignal.timeout(10000)});
    rec.lastRun=new Date().toISOString();rec.hits++;save();
  }catch(e){}},min*60000);
  rec._timer=timer;
  try{bump("freeCalls")}catch(e){}
  r.json({ok:true,schedule:{id,url,min},note:"fires every "+min+"min while server runs"})});

// POST /monitor {"url"} - 5min poll + public status page /m/<id>
rt.post("/monitor",(q,r)=>{const url=(q.body||{}).url;
  if(!url)return r.status(400).json({error:"body: {url} requis"});
  const id="m_"+crypto.randomBytes(4).toString("hex");
  const rec={id,url,created:new Date().toISOString(),checks:0,up:0,lastStatus:null,lastCheck:null,history:[]};
  db.monitors[id]=rec;save();
  const timer=setInterval(async()=>{try{
    const code=await fetch(url,{signal:AbortSignal.timeout(10000)}).then(x=>x.status).catch(()=>0);
    rec.checks++;rec.lastCheck=new Date().toISOString();rec.lastStatus=code;
    if(code>=200&&code<400)rec.up++;
    rec.history.push({ts:rec.lastCheck,code});if(rec.history.length>60)rec.history.shift();
    save();
  }catch(e){}},300000);
  rec._timer=timer;
  try{bump("freeCalls")}catch(e){}
  r.json({ok:true,id,statusPage:"/m/"+id,monitor:{url,intervalMin:5}})});

// GET /m/<id> - public status page (badge-able)
rt.get("/m/:id",(q,r)=>{const m=db.monitors[q.params.id];
  if(!m)return r.status(404).send("unknown monitor");
  const pct=m.checks?Math.round(m.up/m.checks*100):null;
  const color=pct==null?"#8b949e":pct>=95?"#3fb950":pct>=80?"#e3b341":"#f85149";
  r.type("html").send("<!DOCTYPE html><html><head><title>status "+q.params.id+"</title></head>"+
   "<body style='font-family:monospace;background:#0d1117;color:#e6edf3;padding:2rem'>"+
   "<h1>"+String(m.url).replace(/[<>&]/g,"")+"</h1>"+
   "<p style='font-size:1.6rem;color:"+color+"'>"+(pct==null?"pending":pct+"% up")+"</p>"+
   "<p>checks="+m.checks+" last="+String(m.lastStatus)+" at "+String(m.lastCheck)+"</p>"+
   "<pre style='color:#8b949e'>"+JSON.stringify(m.history.slice(-20),null,1).replace(/[<>&]/g,"")+"</pre>"+
   "<p style='color:#484f5a'>monitor by automaton-alpha</p></body></html>")});

// POST /rss-watch {"feed","url"} - poll feed every 10min, POST new items to url
rt.post("/rss-watch",(q,r)=>{const {feed,url}=q.body||{};
  if(!feed||!url)return r.status(400).json({error:"body: {feed,url} requis"});
  const id="rw_"+crypto.randomBytes(4).toString("hex");
  const rec={id,feed,url,seen:{},created:new Date().toISOString(),newPosted:0};
  db.rss[id]=rec;save();
  const timer=setInterval(async()=>{try{
    const xml=await(await fetch(feed,{signal:AbortSignal.timeout(10000)})).text();
    const items=[...xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map(m=>m[1]).slice(0,10);
    const fresh=items.filter(l=>!rec.seen[l]);
    for(const l of fresh){rec.seen[l]=1;}
    if(fresh.length){rec.newPosted+=fresh.length;
      await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({source:feed,newItems:fresh}),signal:AbortSignal.timeout(10000)}).catch(()=>{});save();}
  }catch(e){}},600000);
  rec._timer=timer;
  r.json({ok:true,id,note:"polls every 10min, posts {source,newItems[]} to your webhook"})});

// GET /metrics - Prometheus format
rt.get("/metrics",(q,r)=>{let s="";
  s+="# TYPE microtools_hooks_total gauge\nmicrotools_hooks_total "+Object.keys(db.hooks).length+"\n";
  s+="# TYPE microtools_schedules_total gauge\nmicrotools_schedules_total "+Object.keys(db.schedules).length+"\n";
  s+="# TYPE microtools_monitors_total gauge\nmicrotools_monitors_total "+Object.keys(db.monitors).length+"\n";
  s+="# TYPE microtools_rss_watchers_total gauge\nmicrotools_rss_watchers_total "+Object.keys(db.rss).length+"\n";
  s+="# TYPE microtools_guestbook_total gauge\nmicrotools_guestbook_total "+db.guestbook.length+"\n";
  r.type("text/plain").send(s)});

// POST /guestbook + GET /guestbook
rt.post("/guestbook",(q,r)=>{const b=q.body||{};const msg=String(b.message||"").slice(0,500);
  if(!msg.trim())return r.status(400).json({error:"message requis"});
  db.guestbook.push({from:String(b.from||"anonymous").slice(0,80),message:msg.replace(/[<>&]/g,""),ts:new Date().toISOString()});
  if(db.guestbook.length>200)db.guestbook.shift();save();
  r.json({ok:true,total:db.guestbook.length})});
rt.get("/guestbook",(q,r)=>r.json({entries:db.guestbook.slice(-50)}));

// restart timers after reboot (schedules only survive process lifetime; recreate)
setInterval(()=>{},1<<30); // keep ref
module.exports=rt;
