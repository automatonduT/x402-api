// seo-audit-lite.js [v1] - Curriculum semaine 2 paire 3 (seo-audits-toolkit)
// Methodologie daudit appliquee a MON site: signaux extraits du HTML reel, score deductif.
const fs=require("fs"),path=require("path");
function metas(html){const out={};const tags=html.match(/<meta\b[^>]*>/gi)||[];
for(const t of tags){const n=(t.match(/name=["']([\w-]+)["']/i)||[])[1];
const c=(t.match(/content=["']([\s\S]*?)["']/i)||[])[1];if(n)out[n]=c;}return out;}
function auditHtml(html,url){url=url||"?";const m=metas(html);const issues=[];
const title=((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||"").trim();
if(!title)issues.push("title absent (-15)");else if(title.length>65)issues.push("title long "+title.length+" (-5)");
const desc=m.description||"";if(!desc)issues.push("meta description absente (-10)");else if(desc.length>165)issues.push("desc longue "+desc.length+" (-3)");
const h1=(html.match(/<h1\b/gi)||[]).length;if(h1!==1)issues.push("h1 x"+h1+" attendu 1 (-10)");
const imgs=html.match(/<img\b[^>]*>/gi)||[];const noAlt=imgs.filter(function(t){return !/\balt=/i.test(t);}).length;
if(noAlt)issues.push("img sans alt x"+noAlt+" (-"+(noAlt*2)+")");
const anchors=(html.match(/href=["']#?["']/gi)||[]).length;if(anchors)issues.push("liens ancre vides x"+anchors+" (-"+(anchors*2)+")");
if(!m.viewport)issues.push("viewport absent (-5)");
const text=html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ");
const words=text.split(/\s+/).filter(Boolean).length;if(words<100)issues.push("texte fin "+words+" mots (-5)");
let score=100;for(const i of issues){const d=i.match(/\(-(\d+)\)/);score-=d?(+d[1]):0;}score=Math.max(0,score);
return{url:url,title:title.slice(0,80),descLen:desc.length,h1:h1,words:words,imgNoAlt:noAlt,viewport:!!m.viewport,ogTitle:m["og:title"]?"oui":"non",issues:issues,score:score};}
function auditDir(dir){dir=dir||path.join(__dirname,"..","public");return fs.readdirSync(dir).filter(function(f){return f.endsWith(".html");}).map(function(f){return auditHtml(fs.readFileSync(path.join(dir,f),"utf8"),f);});}
module.exports={auditHtml,auditDir};
if(require.main===module){console.log(JSON.stringify(auditDir(),null,1));}
