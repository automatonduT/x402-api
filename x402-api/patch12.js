const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
// 1. persistent counters: rewrite bump() to load/save stats.json
s=s.replace(/function bump\(k\)\{[^}]*\}/,
`function bump(k){try{var st=JSON.parse(fs.readFileSync(__dirname+"/stats.json","utf8"));}catch(e){st={};}
 st[k]=(st[k]||0)+1;if(!st.startedAt)st.startedAt=Date.now();
 try{fs.writeFileSync(__dirname+"/stats.json",JSON.stringify(st));}catch(e){}
 return st[k];}`);
// 2. on boot, seed in-memory counters from disk (covers any direct counter usage)
if(!s.includes("seedStats")){
  s=s.replace("app.set(\"trust proxy\", true);",
`app.set("trust proxy", true);
try{const _st=JSON.parse(fs.readFileSync(__dirname+"/stats.json","utf8"));for(const k of Object.keys(_st))global.__c=(global.__c||{}),global.__c[k]=_st[k];}catch{}
function seedStats(){}
void seedStats;`);
}
fs.writeFileSync("server.js",s);
console.log("bumpPersistent:",s.includes("stats.json"));
