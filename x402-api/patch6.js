const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes('"/tools/jwt/decode"')){
 const inj=`// --- v0.7 jwt + cron + encoders ---
function b64u(t){ t=t.replace(/-/g,"+").replace(/_/g,"/"); while(t.length%4)t+="="; return Buffer.from(t,"base64").toString("utf8"); }
app.get("/tools/jwt/decode",(q,r)=>{
  const tok=q.query.token; if(!tok||tok.split(".").length<2) return r.status(400).json({error:"?token=<jwt> required"});
  try{
    const [h,p]=tok.split(".");
    bump("freeCalls");
    r.json({header:JSON.parse(b64u(h)),payload:JSON.parse(b64u(p)),verified:false,
      note:"decoded WITHOUT signature verification - never trust for auth decisions"});
  }catch(e){r.status(400).json({error:"undecodable token"});}
});
const DOW=["sun","mon","tue","wed","thu","fri","sat"];
function parseField(f,min,max){ // returns Set of allowed values
  const out=new Set();
  for(const part of String(f).split(",")){
    let step=1,m=part.match(/^(\\*|(\\d+)-(\\d+))(\\/(\\d+))?$/);
    if(!m) throw new Error("bad field: "+part);
    let lo,hi;
    if(m[1]==="*"){lo=min;hi=max;}else{lo=+m[2];hi=+m[3];}
    if(m[5])step=+m[5];
    for(let v=lo;v<=hi;v+=step)out.add(v);
  }
  return out;
}
app.get("/tools/cron/next",(q,r)=>{
  const expr=q.query.expr; const n=Math.min(parseInt(q.query.n||"3",10)||3,10);
  if(!expr) return r.status(400).json({error:"?expr='*/5 * * * *'&n=3"});
  try{
    const f=expr.trim().split(/\\s+/); if(f.length!==5)throw new Error("need exactly 5 fields");
    const mi=parseField(f[0],0,59),ho=parseField(f[1],0,23),da=parseField(f[2],1,31),
          mo=parseField(f[3],1,12),dw=parseField(f[4],0,6);
    const t=new Date();t.setSeconds(0,0);t.setMinutes(t.getMinutes()+1);
    const out=[];
    while(out.length<n){
      if(mi.has(t.getMinutes())&&ho.has(t.getHours())&&mo.has(t.getMonth()+1)
        &&(f[2]==="*"||f[4]==="*"?(da.has(t.getDate())&&dw.has(t.getDay())):(da.has(t.getDate())||dw.has(t.getDay())))){
        out.push(t.toISOString());
      }
      t.setMinutes(t.getMinutes()+1);
      if(Date.now()-t.getTime()>366*24*3600*1000)break; // safety
    }
    bump("freeCalls");
    r.json({expr,nextRuns:out.slice(0,n)});
  }catch(e){r.status(400).json({error:String(e.message||e)});}
});
app.get("/tools/urlenc",(q,r)=>{const t=q.query.text;if(t===undefined)return r.status(400).json({error:"missing ?text="});bump("freeCalls");r.json({out:encodeURIComponent(String(t))});});
app.get("/toolshtmlescape",(q,r)=>null);
app.get("/tools/html/escape",(q,r)=>{const t=q.query.text;if(t===undefined)return r.status(400).json({error:"missing ?text="});bump("freeCalls");r.json({out:String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))});});

`;
 s=s.replace('app.get("/agent-card"', inj+'app.get("/agent-card"');
 // add new op types to paid batch
 s=s.replace('case "jsonfmt": out.push(JSON.stringify(op.obj ?? {}, null, 2)); break;',
   'case "jsonfmt": out.push(JSON.stringify(op.obj ?? {}, null, 2)); break;\n      case "urlenc": out.push(encodeURIComponent(String(op.text))); break;');
 // remove dead probe line
 s=s.replace("app.get(\"/toolshtmlescape\",(q,r)=>null);\n","");
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes('"/tools/jwt/decode"'));
