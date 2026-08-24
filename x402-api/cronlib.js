// cronlib.js — minimal 5-field cron parser: numbers, JAN/MON names, ranges, steps, @shorthands
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const DAYS={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
function norm(field,names){
  return String(field).toLowerCase().split(",").map(function(p){
    p=p.trim();
    p=p.replace(/[a-z]{3}/g,function(w){if(names[w]!==undefined)return String(names[w]);throw new Error("unknown name: "+w);});
    return p;}).join(",");
}
function expand(field,min,max,names){
  const f=norm(field,names||{});
  const chunks=f.split("/");const step=chunks[1]?parseInt(chunks[1],10):1;
  if(!step||step<1)throw new Error("bad step in '"+field+"'");
  let lo=min,hi=max;
  if(chunks[0]!=="*"){const m=chunks[0].split("-");
    lo=parseInt(m[0],10);hi=(m[1]!==undefined)?parseInt(m[1],10):lo;
    if(isNaN(lo)||isNaN(hi))throw new Error("bad value in '"+field+"'");}
  const set=[];for(let v=lo;v<=hi;v+=step)set.push(v);
  if(!set.length)throw new Error("empty field '"+field+"'");
  return set;
}
function nextRuns(expr,n){
  let t=String(expr).trim().split(" ").filter(function(x){return x.length>0;});
  if(t.length===1&&t[0][0]==="@"){
    if(t[0]==="@hourly")t=["0","*","*","*","*"];
    else if(t[0]==="@daily"||t[0]==="@midnight")t=["0","0","*","*","*"];
    else throw new Error("unsupported shorthand "+t[0]);}
  if(t.length!==5)throw new Error("need exactly 5 fields");
  const mi=expand(t[0],0,59),ho=expand(t[1],0,23),da=expand(t[2],1,31),
        mo=expand(t[3],1,12,MONTHS),dw=expand(t[4],0,6,DAYS);
  const out=[];const d=new Date();d.setSeconds(0,0);d.setMinutes(d.getMinutes()+1);
  const limit=Date.now()+400*24*3600*1000;
  while(out.length<n&&Date.now()<limit){
    const domOk=da.indexOf(d.getDate())>=0,dowOk=dw.indexOf(d.getDay())>=0;
    const dayOk=(t[2]==="*"||t[4]==="*")?(domOk&&dowOk):(domOk||dowOk);
    if(mi.indexOf(d.getMinutes())>=0&&ho.indexOf(d.getHours())>=0&&mo.indexOf(d.getMonth()+1)>=0&&dayOk)
      out.push(new Date(d.getTime()).toISOString());
    d.setMinutes(d.getMinutes()+1);}
  if(out.length<n)throw new Error("no matching time within 400 days");
  return out;
}
module.exports={nextRuns};
function matches(date,expr){
  let t=String(expr).trim().split(" ").filter(x=>x.length>0);
  if(t.length===1&&t[0][0]==="@"){
    if(t[0]==="@hourly")t=["0","*","*","*","*"];
    else if(t[0]==="@daily"||t[0]==="@midnight")t=["0","0","*","*","*"];
    else throw new Error("unsupported shorthand");}
  if(t.length!==5)throw new Error("need exactly 5 fields");
  const mi=expand(t[0],0,59),ho=expand(t[1],0,23),da=expand(t[2],1,31),
        mo=expand(t[3],1,12,MONTHS),dw=expand(t[4],0,6,DAYS);
  const domOk=da.indexOf(date.getDate())>=0,dowOk=dw.indexOf(date.getDay())>=0;
  const dayOk=(t[2]==="*"||t[4]==="*")?(domOk&&dowOk):(domOk||dowOk);
  return mi.indexOf(date.getMinutes())>=0&&ho.indexOf(date.getHours())>=0&&mo.indexOf(date.getMonth()+1)>=0&&dayOk;
}
module.exports.matches=matches;
