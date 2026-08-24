const fs=require("fs");const {execFileSync}=require("child_process");
const {matches}=require("./cronlib");
const FILE=__dirname+"/jobs.json";
const load=()=>{try{return JSON.parse(fs.readFileSync(FILE,"utf8"));}catch(e){return[];}};
const save=j=>{const tmp=FILE+".tmp";fs.writeFileSync(tmp,JSON.stringify(j,null,1));fs.renameSync(tmp,FILE);};
function fire(url,payload){
  if(!/^https?:\/\/[A-Za-z0-9._~:\/?#\[\]@!$&()*+,;=%-]+$/.test(url))return "bad-url";
  try{execFileSync("curl",["-s","-m","8","-X","POST","-H","Content-Type: application/json","-d",JSON.stringify(payload),url],{stdio:"pipe"});return "sent";}
  catch(e){return "err";}
}
setInterval(()=>{
  const jobs=load();let changed=false;
  const d=new Date();d.setSeconds(0,0);const iso=d.toISOString();
  for(const job of jobs){
    try{
      if(!matches(d,job.expr))continue;
      if(job.lastFired===iso)continue;
      job.lastFired=iso;job.fires=(job.fires||0)+1;changed=true;
      const payload=(job.body&&typeof job.body==="object")?Object.assign({},job.body,{event:"scheduled-fire",id:job.id}):{event:"scheduled-fire",id:job.id,expr:job.expr,ts:Date.now()};
      job.lastStatus=fire(job.url,payload);
    }catch(e){job.err=String(e.message||e).slice(0,80);changed=true;}
  }
  if(changed)save(jobs);
},20000);
console.log("runner v3 alive (custom-body)");
