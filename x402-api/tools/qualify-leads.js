// qualify-leads.js [v1] - transforme les leads COLD en leads qualifies par preuves datees.
// Douleur detectee (site mort, manifest casse) -> fact date -> scoreLead passera en WARM/HOT.
const fs=require("fs"),path=require("path");
async function probe(url){const t=Date.now();try{const r=await fetch(url,{signal:AbortSignal.timeout(8000)});return{url,status:r.status,ms:Date.now()-t};}catch(e){return{url,status:0,err:(e.cause&&e.cause.code)||e.name,ms:Date.now()-t};}}
function evidence(c){return c.map(x=>x.url.replace(/^https?:\/\//,"").slice(0,45)+"="+(x.status||x.err)+"/"+x.ms+"ms").join(", ");}
function painFrom(checks){const day=new Date().toISOString().slice(0,10);const home=checks.find(x=>!x.url.includes(".well-known"));const man=checks.find(x=>x.url.includes(".well-known"));
if(home&&home.status===0)return{pain:true,fact:"site injoignable ("+home.err+") le "+day};
if(man&&man.status>=400)return{pain:true,fact:"manifest x402 casse ("+man.status+") le "+day};
if(home&&home.status>=500)return{pain:true,fact:"erreur serveur "+home.status+" le "+day};
return{pain:false,fact:"surface saine le "+day};}
async function qualifyLeads(leads){const out=[];for(const l of leads||[]){let d=l.domain||"";if(!/^https?:/.test(d))continue;
const base=d.split("/.well-known")[0].replace(/\/$/,"");
const checks=[await probe(base+"/"),await probe(base+"/.well-known/x402-manifest.json")];
out.push(Object.assign({},l,painFrom(checks),{checkedAt:new Date().toISOString(),checks:evidence(checks)}));}return out;}
module.exports={probe,painFrom,qualifyLeads};
if(require.main===module){(async()=>{const f=path.join(__dirname,"..","data","leads.jsonl");let leads=null;
try{leads=fs.readFileSync(f,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse);}catch(e){}
if(!leads){console.log("NO_LEADS");return;}
const q=await qualifyLeads(leads);
const lf=path.join(__dirname,"..","data","qualifications.jsonl");
for(const r of q)fs.appendFileSync(lf,JSON.stringify(r)+"\n");
console.log(JSON.stringify(q,null,2));})();}
