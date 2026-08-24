// legacy-tools.js - free utility endpoints restored as a clean router [v1.79]
const express=require("express");
const crypto=require("crypto");
const rt=express.Router();
rt.use(express.json({limit:"1mb"}));

rt.get("/tools/uuid",(q,r)=>{const n=Math.min(parseInt(q.query.n)||1,100);const out=[];for(let i=0;i<n;i++)out.push(crypto.randomUUID());r.json({uuids:out})});

rt.get("/tools/hash",(q,r)=>{const data=q.query.data||"";const algo=["sha256","sha1","md5"].includes(q.query.algo)?q.query.algo:"sha256";r.json({algo,hash:crypto.createHash(algo).update(String(data)).digest("hex")})});

rt.get("/tools/base64",(q,r)=>{try{const t=String(q.query.text||"");const m=q.query.mode==="d"?"decode":"encode";
 const out=m==="encode"?Buffer.from(t,"utf8").toString("base64"):Buffer.from(t,"base64").toString("utf8");
 r.json({mode:m,input:t,output:out})}catch(e){r.status(400).json({error:String(e.message||e)})}});

rt.get("/tools/time",(q,r)=>{const now=new Date();r.json({iso:now.toISOString(),unix:Math.floor(now.getTime()/1000),utc:now.toUTCString()})});

rt.get("/tools/slugify",(q,r)=>{const t=String(q.query.text||"");r.json({slug:t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)})});

rt.post("/tools/json/format",(q,r)=>{try{const indent=Math.min(parseInt(q.query.indent)||2,8);r.type("application/json").send(JSON.stringify(q.body,null,indent))}catch(e){r.status(400).json({error:"json invalide"})}});

rt.post("/tools/json2csv",(q,r)=>{try{const rows=q.body&&q.body.rows;if(!Array.isArray(rows)||!rows.length)return r.status(400).json({error:"body: {rows:[{...}]} requis"});
 const keys=[...new Set(rows.flatMap(o=>Object.keys(o)))];
 const esc=v=>{const s=v==null?"":String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 const csv=keys.join(",")+"\n"+rows.map(o=>keys.map(k=>esc(o[k])).join(",")).join("\n");
 r.type("text/csv").send(csv)}catch(e){r.status(400).json({error:String(e.message||e)})}});

rt.post("/tools/csv2json",(q,r)=>{try{const csv=String((q.body||{}).csv||"");if(!csv.trim())return r.status(400).json({error:"body: {csv:'a,b\\n1,2'} requis"});
 const lines=csv.trim().split(/\r?\n/);const hdr=lines[0].split(",").map(s=>s.trim());
 const parseLine=l=>{const out=[];let cur="",inq=false;for(let i=0;i<l.length;i++){const c=l[i];
  if(c==='"'){if(inq&&l[i+1]==='"'){cur+='"';i++;}else inq=!inq;}
  else if(c===","&&!inq){out.push(cur);cur="";}else cur+=c;}
 out.push(cur);return out};
 const out=[];for(let i=1;i<lines.length;i++){const vals=parseLine(lines[i]);const o={};hdr.forEach((h,j)=>o[h]=vals[j]);out.push(o)}
 r.json({rows:out,count:out.length})}catch(e){r.status(400).json({error:String(e.message||e)})}});

rt.get("/tools/jwt/decode",(q,r)=>{try{const parts=String(q.query.token||"").split(".");if(parts.length<2)return r.status(400).json({error:"token jwt requis"});
 const dec=p=>JSON.parse(Buffer.from(p.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8"));
 r.json({header:dec(parts[0]),payload:dec(parts[1]),note:"signature non verifiee - decode seul"})}catch(e){r.status(400).json({error:"jwt invalide"})}});

module.exports=rt;
