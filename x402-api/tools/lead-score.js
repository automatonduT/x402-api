// lead-score.js [v1] - Curriculum paire 3 (OpenOutreach, miroir commercial)
// Concept 1: scoring -> prioriser les pitches par douleur prouvee.
// Concept 2: personnalisation -> angle derive des FAITS dates du lead.
function scoreLead(l){l=l||{};let s=0;const why=[];
if(l.smtp==="verified"){s+=30;why.push("smtp+30")}else if(l.smtp==="dead"){s-=40;why.push("smtp-40")}
if(l.painEvidence){s+=25;why.push("pain+25")}
if(l.endpointLive===false){s+=15;why.push("down+15")}
if(l.replied){s+=20;why.push("replied+20")}
if(l.contactable!==false&&l.domainLive){s+=10;why.push("reachable+10")}
return{lead:l.domain||"?",score:s,tier:s>=60?"HOT":(s>=30?"WARM":(s<0?"DROP":"COLD")),why};}
function personalize(l){const f=(l.fact||"aucun fait date");return{angle:"Votre endpoint "+(l.domain||"?")+" : "+f,pitch:"Audit $5 x402, preuves datees, sans engagement."};}
module.exports={scoreLead,personalize};
if(require.main===module){console.log(JSON.stringify(scoreLead({domain:"assetforge",smtp:"verified",painEvidence:true,domainLive:true})));console.log(JSON.stringify(scoreLead({domain:"x",smtp:"dead"})));console.log(JSON.stringify(personalize({domain:"assetforge",fact:"2 liens morts le 2026-08-24"})));}
