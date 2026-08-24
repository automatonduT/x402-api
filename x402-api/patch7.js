const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
if(!s.includes("MONTHS")){
 const inj=`const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const DAYS={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
function normNames(f,i){ // lowercase; map names->numbers per field
  const map=i===4?DAYS:(i===3?MONTHS:null);
  return String(f).toLowerCase().split(",").map(p=>{
    if(map){for(const k in map){p=p.replace(new RegExp("\\\\b"+k+"\\\\b","g"),map[k]);}}
    return p;}).join(",");
}
`;
 s=s.replace("function parseField(", inj+"function parseField(");
 // apply normNames in cron route
 s=s.replace('const f=expr.trim().split(/\\\\s+/); if(f.length!==5)throw new Error("need exactly 5 fields");',
   'let f=expr.trim().split(/\\\\s+/); if(f.length!==5)throw new Error("need exactly 5 fields");\n    if(f[0]==="@hourly")f=["0","*","*","*","*"]; if(f[0]==="@daily")f=["0","0","*","*","*"];\n    f=f.map((x,i)=>normNames(x,i));');
 // add batch ops for jwt+cron
 s=s.replace('case "urlenc": out.push(encodeURIComponent(String(op.text))); break;',
   'case "urlenc": out.push(encodeURIComponent(String(op.text))); break;\n      case "cronnext": { let ff=String(op.expr).trim().split(/\\\\s+/);\n        if(ff.length===5){ ff=ff.map((x,i)=>normNames(x,i));\n          try{ const mi2=parseField(ff[0],0,59),ho2=parseField(ff[1],0,23),da2=parseField(ff[2],1,31),mo2=parseField(ff[3],1,12),dw2=parseField(ff[4],0,6);\n            const t=new Date();t.setSeconds(0,0);t.setMinutes(t.getMinutes()+1);const runs=[];\n            while(runs.length<(op.n||1)&&Date.now()-t.getTime()<366*24*3600*1000){\n              if(mi2.has(t.getMinutes())&&ho2.has(t.getHours())&&mo2.has(t.getMonth()+1)&&(ff[2]==="*"||ff[4]==="*"?(da2.has(t.getDate())&&dw2.has(t.getDay())):(da2.has(t.getDate())||dw2.has(t.getDay()))))runs.push(t.toISOString());\n              t.setMinutes(t.getMinutes()+1);} out.push(runs);}catch(e){errors.push({i,error:String(e.message||e)});}\n        } else errors.push({i,error:"need 5-field cron expr"}); } break;');
 fs.writeFileSync("server.js",s);}
console.log("patched:",s.includes("MONTHS"));
