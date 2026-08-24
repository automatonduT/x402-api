// outreach-pipeline.js [v2] - pipeline pitch quotidien (scoreLead + warmup + personalize).
// v2: normalisation schema CRM reel + filtre anti-self.
const {scoreLead,personalize}=require("./lead-score");
const {rampSchedule,engagementGate}=require("./warmup-plan");
const fs=require("fs"),path=require("path");
const SELF_RE=/ngrok-free|skintight-snowcap|localhost|127\.0\.0\.1/;
function norm(l){return{domain:l.domain||l.host||l.url||"?",smtp:l.smtp||l.smtp_status||l.smtpStatus,painEvidence:!!(l.painEvidence||l.pain||l.dead_links),endpointLive:l.endpointLive,domainLive:l.domainLive===undefined?true:!!l.domainLive,replied:!!l.replied,fact:(typeof l.fact==="string"&&l.fact)||l.note||(typeof l.evidence==="string"?l.evidence:null)};}
function loadLeads(p){try{return fs.readFileSync(p,"utf8").trim().split("\n").filter(Boolean).map(x=>norm(JSON.parse(x)));}catch(e){return null;}}
function planToday(opts){opts=opts||{};const raw=(opts.leads||[]).map(norm).filter(l=>l.domain!=="?"&&!SELF_RE.test(l.domain));
const eng=engagementGate(opts.engagement||{});
const cap=rampSchedule(opts.warmup||{})[0].perDay;
const seen={},leads=[];for(const l of raw){if(seen[l.domain])continue;seen[l.domain]=1;leads.push(l);}
const scored=leads.map(scoreLead).filter(l=>l.tier!=="DROP").sort((a,b)=>b.score-a.score);
const queue=scored.slice(0,cap).map(s=>{const src=leads.find(l=>l.domain===s.lead);return Object.assign({},s,personalize(src||{}));});
return{gated:eng.action,cap,total:leads.length,queue};}
module.exports={planToday,loadLeads,norm};
if(require.main===module){const f=path.join(__dirname,"..","data","leads.jsonl");
const leads=loadLeads(f)||[{domain:"assetforge",smtp:"verified",painEvidence:true,domainLive:true,fact:"2 liens morts le 2026-08-24"},{domain:"dead-domain",smtp:"dead"}];
console.log(JSON.stringify(planToday({leads,engagement:{sent:9,replies:1,bounces:0}})));}
