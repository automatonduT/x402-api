// outreach-pipeline.js [v1] - integre les 4 paires curriculum en un pipeline operationnel.
// scoreLead (qui pitcher) + warmup-plan (combien) + personalize (quoi dire).
const {scoreLead,personalize}=require("./lead-score");
const {rampSchedule,engagementGate}=require("./warmup-plan");
const fs=require("fs"),path=require("path");
function loadLeads(p){try{return fs.readFileSync(p,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse);}catch(e){return null;}}
function planToday(opts){opts=opts||{};const leads=opts.leads||[];
const eng=engagementGate(opts.engagement||{});
const cap=rampSchedule(opts.warmup||{})[0].perDay;
const scored=leads.map(scoreLead).filter(l=>l.tier!=="DROP").sort((a,b)=>b.score-a.score);
const queue=scored.slice(0,cap).map(s=>{const src=leads.find(l=>(l.domain||"?")===s.lead);return Object.assign({},s,personalize(src||{}));});
return{gated:eng.action,cap,queue};}
module.exports={planToday,loadLeads};
if(require.main===module){const f=path.join(__dirname,"..","data","leads.jsonl");
const leads=loadLeads(f)||[{domain:"assetforge",smtp:"verified",painEvidence:true,domainLive:true,fact:"2 liens morts le 2026-08-24"},{domain:"dead-domain",smtp:"dead"},{domain:"nexior",domainLive:true}];
console.log(JSON.stringify(planToday({leads:leads,engagement:{sent:9,replies:1,bounces:0}}),null,2));}
