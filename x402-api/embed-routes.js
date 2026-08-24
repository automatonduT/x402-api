// micro-tools embeddable SVG widgets - URL-parameter driven, self-reporting (?ref=)
'use strict';
const path=require('path'),fs=require('fs');
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function logRef(q){try{const ref=String((q.query||{}).ref||'').slice(0,80);if(!ref)return;
 const f=path.join(__dirname,'refs-inbound.json');
 const arr=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):[];
 arr.push({t:new Date().toISOString(),ref:ref,ua:String(q.headers['user-agent']||'').slice(0,120)});
 fs.writeFileSync(f,JSON.stringify(arr.slice(-200)));}catch(e){}}
function svgWrap(w,h,body){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>';}
module.exports=function(app,d){const bump=(d&&typeof d.bump==='function')?d.bump:function(){};
 // /spark.svg?data=1,2,4,3&color=22c55e&w=160&h=40&ref=you
 app.get('/spark.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const pts=String(q.query.data||'').split(',').map(Number).filter(v=>isFinite(v)).slice(-50);
  if(pts.length<2)return r.status(400).type('text/plain').send('need data=a,b,c..');
  const w=Math.min(parseInt(q.query.w)||160,600),h=Math.min(parseInt(q.query.h)||40,200);
  const col=(String(q.query.color||'58a6ff').replace(/[^0-9a-fA-F]/g,'').slice(0,6))||'58a6ff';
  const mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),rg=(mx-mn)||1;
  const step=w/(pts.length-1);
  let d='';
  pts.forEach((v,i)=>{const x=(i*step).toFixed(1),y=(h-3-((v-mn)/rg)*(h-6)).toFixed(1);d+=(i?' L':'M')+x+' '+y;});
  const up=pts[pts.length-1]>=pts[0];
  const body='<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="6"/>'
   +'<path d="'+d+'" fill="none" stroke="#'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
   +'<circle cx="'+w+'" cy="'+(h-3-((pts[pts.length-1]-mn)/rg)*(h-6)).toFixed(1)+'" r="2.5" fill="#'+col+'"/>'
   +'<title>spark '+(up?'up':'down')+'</title>';
  return r.type('image/svg+xml').set('Cache-Control','public,max-age=60').send(svgWrap(w,h,body));
 }catch(e){r.status(500).send(String(e&&e.message||e));}});
 // /bars.svg?a=5&b=12&labels=alpha,beta&ref=you
 app.get('/bars.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const qp=q.query||{};
  const labels=String(qp.labels||'').split(',').map(s=>s.trim()).slice(0,8);
  const keys=Object.keys(qp).filter(k=>k!=='labels'&&k!=='ref'&&k!=='w'&&k!=='h'&&k!=='color');
  const vals=keys.map(k=>Number(qp[k])).map(v=>isFinite(v)?v:0).slice(0,8);
  if(!vals.length)return r.status(400).type('text/plain').send('need a=1&b=2..');
  const w=Math.min(parseInt(qp.w)||240,600),h=Math.min(parseInt(qp.h)||100,300);
  const col=(String(qp.color||'7ee787').replace(/[^0-9a-fA-F]/g,'').slice(0,6))||'7ee787';
  const mx=Math.max.apply(null,vals.concat([1]));
  const bw=Math.floor((w-20)/vals.length)-8;
  let bars='',y=h-18;
  vals.forEach((v,i)=>{const bh=Math.max(2,Math.round((v/mx)*(h-34)));
   const x=10+i*(bw+8);const lab=esc(labels[i]||keys[i]||i).slice(0,10);
   bars+='<rect x="'+x+'" y="'+(y-bh)+'" width="'+bw+'" height="'+bh+'" rx="3" fill="#'+col+'"/>'
    +'<text x="'+(x+bw/2)+'" y="'+(h-5)+'" font-size="9" fill="#8b949e" text-anchor="middle" font-family="monospace">'+lab+'</text>'
    +'<text x="'+(x+bw/2)+'" y="'+(y-bh-3)+'" font-size="9" fill="#c9d1d9" text-anchor="middle" font-family="monospace">'+v+'</text>';});
  return r.type('image/svg+xml').set('Cache-Control','public,max-age=60')
   .send(svgWrap(w,h,'<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="6"/>'+bars));
 }catch(e){r.status(500).send(String(e&&e.message||e));}});
 // /card.svg?title=build+status&value=passing&sub=v1.14&ref=you
 app.get('/card.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const t=esc(String((q.query||{}).title||'status')).slice(0,24);
  const v=esc(String((q.query||{}).value||'ok')).slice(0,24);
  const s=esc(String((q.query||{}).sub||'')).slice(0,30);
  const col=(String((q.query||{}).color||'238636').replace(/[^0-9a-fA-F]/g,'').slice(0,6))||'238636';
  const w=180,h=64;
  const subLine=s?('<text x="14" y="54" font-size="10" fill="#8b949e" font-family="monospace">'+s+'</text>'):'';
  const body='<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="8"/>'
   +'<rect x="0" y="0" width="4" height="'+h+'" fill="#'+col+'" rx="2"/>'
   +'<text x="14" y="20" font-size="11" fill="#8b949e" font-family="monospace">'+t.toUpperCase()+'</text>'
   +'<text x="14" y="38" font-size="14" fill="#c9d1d9" font-family="monospace" font-weight="bold">'+v+'</text>'+subLine;
  return r.type('image/svg+xml').set('Cache-Control','public,max-age=60').send(svgWrap(w,h,body));
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // generic disk-driven /blogN renderer - supersedes per-post cloned routes
 app.get(/^\/blog[0-9]+$/,(q,r)=>{try{
  const list=JSON.parse(fs.readFileSync(path.join(__dirname,"posts.json"),"utf8"));
  const e=list.find(p=>p.p===q.path);
  if(!e)return r.status(404).json({error:"no such post"});
  let md="";try{md=fs.readFileSync(path.join(__dirname,e.f),"utf8");}catch(x){return r.status(500).send("post file missing");}
  const esc2=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  let b=esc2(md);
  b=b.replace(/^# (.+)$/m,"<h1>$1</h1>").replace(/^## (.+)$/m,"<h2>$1</h2>");
  b=b.replace(/\[([^\]]+)\]\(([^)]+)\)/g,"<a href='$2'>$1</a>");
  b=b.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>");
  const paras=b.split(/\n{2,}/).map(seg=>/^<h/.test(seg.trim())?seg:"<p>"+seg.replace(/\n/g,"<br>")+"</p>").join("\n");
  const num=n=>parseInt(String(n).replace(/[^0-9]/g,''))||0;
  const sorted=list.map(x=>x.p).sort((a,b)=>num(a)-num(b));
  const i=sorted.indexOf(q.path);
  const prev=i>0?sorted[i-1]:null, next=i>=0&&i<sorted.length-1?sorted[i+1]:null;
  const nav=(p,l)=>p?"<a href='"+p+"'>"+l+"</a>":"";
  const desc=esc2(md.replace(/^#.*$/m,'').trim().slice(0,140));
  r.type("html").send("<!doctype html><html><head><meta charset='utf-8'><title>"+esc2(e.t)+"</title><meta property='og:title' content='"+esc2(e.t)+"'><meta property='og:description' content='"+desc+"'><meta name='twitter:card' content='summary'><link rel='alternate' type='application/rss+xml' title='micro-tools experiments' href='/blog.xml'><script type='application/ld+json'>"+JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting','headline':esc2(e.t),'datePublished':(e.d||''),'url':q.path})+"</script><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{background:#0d1117;color:#c9d1d9;font-family:-apple-system,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;line-height:1.6}a{color:#58a6ff}code{background:#161b22;padding:2px 5px;border-radius:4px}</style></head><body>"+paras+"<hr><p>"+(nav(prev,'&larr; prev')+(prev&&next?' &#183; ':''))+nav(next,'next &rarr;')+"</p><p><a href='/blog'>&larr; all posts</a> &#183; <a href='/'>micro-tools home</a></p></body></html>");
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // /tools/market/heat.svg?symbols=BTCUSDT,ETHUSDT - LIVE 24h heatmap (SIM disclaimer)
 app.get('/tools/market/heat.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const syms=String(q.query.symbols||'BTCUSDT,ETHUSDT,SOLUSDT').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9]{4,12}$/.test(x)).slice(0,8);
  if(!syms.length)return r.status(400).type('text/plain').send('need symbols=A,B');
  require('./heat.js').getHeat(syms,(e,ticks)=>{
   try{
    const w=Math.min(parseInt(q.query.w)||320,600);
    const tileW=w/2,tileH=54,rows=Math.max(1,Math.ceil(syms.length/2)),h=rows*tileH+2;
    const data=e?[]:(ticks||[]);let tiles='';
    syms.forEach((sym,i)=>{
     let pct=null,px=null;
     if(data.length){const m=data.find(z=>z.symbol===sym);if(m){pct=parseFloat(m.priceChangePercent);px=parseFloat(m.lastPrice);}}
     let fill='#161b22',fg='#8b949e';
     if(pct!==null&&isFinite(pct)){const c=Math.max(-1,Math.min(1,pct/5));
      if(pct>=0){fill='rgb(13,'+Math.round(34+c*86)+',38)';fg='#3fb950';}
      else{fill='rgb('+Math.round(34+Math.abs(c)*86)+',13,25)';fg='#f85149';}}
     const x=(i%2)*tileW+1,y=Math.floor(i/2)*tileH+1;
     const pt=pct===null||!isFinite(pct)?'n/a':((pct>0?'+':'')+pct.toFixed(2)+'%');
     const pxt=px===null||!isFinite(px)?'':(px>=100?px.toFixed(0):px.toFixed(px>=1?2:4));
     tiles+='<rect x="'+x+'" y="'+y+'" width="'+(tileW-2)+'" height="'+(tileH-2)+'" rx="6" fill="'+fill+'" stroke="#21262d"/>'
      +'<text x="'+(x+10)+'" y="'+(y+20)+'" font-size="12" font-family="monospace" font-weight="bold" fill="'+fg+'">'+esc(sym)+'</text>'
      +'<text x="'+(x+10)+'" y="'+(y+38)+'" font-size="11" font-family="monospace" fill="'+fg+'">'+pt+'</text>'
      +'<text x="'+(x+tileW-14)+'" y="'+(y+20)+'" font-size="9" font-family="monospace" fill="#8b949e" text-anchor="end">'+esc(pxt)+'</text>';});
    const foot='<text x="'+(w-6)+'" y="'+(h-4)+'" font-size="8" font-family="monospace" fill="#484f58" text-anchor="end">micro-tools &#183; SIM</text>';
    r.type('image/svg+xml').set('Cache-Control','public,max-age=60').send(svgWrap(w,h,'<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="8"/>'+tiles+foot));
   }catch(x){r.status(500).send(String(x&&x.message||x));}});
  }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // oEmbed discovery: GET /oembed?url=<widget>&format=json|xml
 app.get('/oembed',(q,r)=>{try{
  const u=String(q.query.url||'');
  const m=u.match(/^https?:\/\/[^/]+\/(spark\.svg|bars\.svg|card\.svg|tools\/market\/(heat\.svg|equity\.svg))$/);
  if(!m)return r.status(404).json({error:'unrecognized widget url'});
  const dims={'spark.svg':[160,40],'bars.svg':[240,100],'card.svg':[180,64],'heat.svg':[320,110],'equity.svg':[640,320]};
  const key=m[2]||m[1];const[wd,ht]=dims[key]||[240,120];
  const title='micro-tools '+(key.replace('.svg','')+' widget');
  if(String(q.query.format||'json').toLowerCase()==='xml'){
   return r.type('text/xml').send('<?xml version="1.0" encoding="utf-8"?>'+
    '<oembed><version>1.0</version><type>photo</type><title>'+esc(title)+'</title>'+
    '<url>'+esc(u)+'</url><width>'+wd+'</width><height>'+ht+'</height>'+
    '<provider_name>micro-tools by automaton-alpha</provider_name></oembed>');}
  r.type('application/json').send({version:'1.0',type:'photo',title:title,url:u,width:wd,height:ht,provider_name:'micro-tools by automaton-alpha'});
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // disk-driven machine catalogs - independent of static-mount quirks
 const serveFile=(r,file,type)=>{try{
  r.type(type).set('Cache-Control','public,max-age=300').send(fs.readFileSync(path.join(__dirname,'public',file)));
 }catch(e){r.status(500).send(String(e&&e.message||e));}};
 app.get('/widgets.json',(q,r)=>serveFile(r,'widgets.json','application/json'));
 app.get('/widget-builder.html',(q,r)=>serveFile(r,'widget-builder.html','text/html'));
 app.get('/widget-builder',(q,r)=>r.redirect(301,'/widget-builder.html'));
  app.get('/quickstart.sh',(q,r)=>{r.type('application/x-sh').setHeader('Content-Disposition','inline');r.send(fs.readFileSync(path.join(__dirname,'public','quickstart.sh')))});
 app.get('/desk.html',(q,r)=>serveFile(r,'desk.html','text/html'));
 app.get('/desk',(q,r)=>r.redirect(301,'/desk.html'));
 app.get('/90437c9998be41d7ae840d41f256f210.txt',(q,r)=>serveFile(r,'90437c9998be41d7ae840d41f256f210.txt','text/plain'));

 // /tools/market/regime?symbols=BTCUSDT,.. - playbook#2 decision matrix, live
 app.get('/tools/market/regime',(q,r)=>{try{bump('freeCalls');logRef(q);
  const syms=String(q.query.symbols||'BTCUSDT,ETHUSDT,SOLUSDT').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9]{4,12}$/.test(x)).slice(0,6);
  require('./regime.js').get(syms,(e,d)=>{if(e)return r.status(502).json({error:String(e.message||e)});r.type('application/json').set('Cache-Control','public,max-age=60').send(d);});
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // /tools/market/regime.svg - LIVE playbook matrix strip (twin of heat.svg)
 app.get('/tools/market/regime.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const syms=String(q.query.symbols||'BTCUSDT,ETHUSDT,SOLUSDT').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9]{4,12}$/.test(x)).slice(0,6);
  require('./regime.js').get(syms,(e,d)=>{try{
   if(e)return r.status(502).send('upstream');
   const w=Math.min(parseInt(q.query.w)||340,600);const rowH=24,h=d.pairs.length*rowH+14;
   let rows='';
   d.pairs.forEach((p,i)=>{
    const col=p.regime==='trend'?'#3fb950':(p.regime==='range'?'#58a6ff':'#8b949e');
    const bg=p.regime==='trend'?'rgb(13,40,38)':(p.regime==='range'?'13,34,56':'#161b22');
    const y=i*rowH+2;
    const squeezeDot=p.squeeze?'<circle cx="'+(w-52)+'" cy="'+(y+rowH/2)+'" r="4" fill="#d29922"/>':'';
    const hot=p.fundingHot?'<text x="'+(w-42)+'" y="'+(y+rowH/2+4)+'" font-size="9" font-family="monospace" fill="#f85149">HOT</text>':'';
    rows+='<rect x="1" y="'+y+'" width="'+(w-2)+'" height="'+(rowH-3)+'" rx="5" fill="'+bg+'" stroke="#21262d"/>'
     +'<text x="10" y="'+(y+16)+'" font-size="11" font-family="monospace" font-weight="bold" fill="#c9d1d9">'+esc(p.symbol)+'</text>'
     +'<text x="86" y="'+(y+16)+'" font-size="11" font-family="monospace" font-weight="bold" fill="'+col+'">'+esc(p.regime.toUpperCase())+' '+p.adx14h+'</text>'
     +(p.systemsOn&&p.systemsOn.length?'<text x="170" y="'+(y+16)+'" font-size="9" font-family="monospace" fill="#7ee787">'+esc(p.systemsOn.join(' ').slice(0,26))+'</text>':'<text x="170" y="'+(y+16)+'" font-size="9" font-family="monospace" fill="#484f58">FLAT is a position</text>')
     +squeezeDot+hot;});
   const foot='<text x="'+(w-6)+'" y="'+(h-4)+'" font-size="8" font-family="monospace" fill="#484f58" text-anchor="end">micro-tools regime &#183; SIM</text>';
   r.type('image/svg+xml').set('Cache-Control','public,max-age=60').send(svgWrap(w,h,'<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="8"/>'+rows+foot));
  }catch(x){r.status(500).send(String(x&&x.message||x));}});
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // /tools/market/journal - execution quality per system (playbook#1 s6: MFE/MAE hindsight)
 app.get('/tools/market/journal',(q,r)=>{try{bump('freeCalls');logRef(q);
  require('./journal.js').get((e,d)=>{if(e)return r.status(502).json({error:String(e.message||e)});r.type('application/json').set('Cache-Control','public,max-age=60').send(d);});
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // /tools/market/positions.svg - LIVE open paper-book strip (twin of regime.svg)
 app.get('/tools/market/positions.svg',(q,r)=>{try{bump('freeCalls');logRef(q);
  const fs=require('fs'),path=require('path'),https=require('https');
  const w=Math.min(parseInt(q.query.w)||380,600);const rowH=22;
  let txt='';try{txt=fs.readFileSync(path.join(__dirname,'..','experiments.md'),'utf8');}catch(e){}
  const pos=[];
  txt.split('\n').forEach(l=>{if(!l.includes('| PAPER |')||!l.includes('verdict=PENDING'))return;
   const m=l.match(/\| PAPER \| ([^|]+)\| (\w+) (\w+): (\w+) entry=([\d.]+) stop=([\d.]+|-) target=([\d.]+|-)/);
   if(!m)return;
   let age='-';try{age=Math.max(1,Math.round((Date.now()-new Date(m[1].trim()).getTime())/36e5))+'h';}catch(_){}
   pos.push({sym:m[2],sys:m[3],side:m[4],entry:+m[5],stop:m[6],target:m[7],age});});
  const syms=[...new Set(pos.map(p=>p.sym))];
  const q1=syms.map(sym=>new Promise(res=>{https.get('https://api.binance.com/api/v3/ticker/price?symbol='+sym,x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>{try{res({sym,px:parseFloat(JSON.parse(d).price)});}catch(e){res({sym,px:null});}});}).on('error',()=>res({sym,px:null})).setTimeout(6000,function(){this.destroy();res({sym,px:null});});}));
  Promise.all(q1).then(quotes=>{
   const pxOf={};quotes.forEach(x=>{if(x.px!=null)pxOf[x.sym]=x.px;});
   const h=pos.length*rowH+26;
   let rows='';
   pos.forEach((p,i)=>{
    const px=pxOf[p.sym],y=i*rowH+2;
    const pct=px?((px-p.entry)/p.entry*100):null;
    const col=pct==null?'#484f58':(pct>=0?'#3fb950':'#f85149');
    const st=p.stop==='-'?null:+p.stop,tg=p.target==='-'?null:+p.target;
    const toStop=(px!=null&&st)?(((px-st)/px)*100).toFixed(1):'-';
    const toTgt=(px!=null&&tg)?(((tg-px)/px)*100).toFixed(1):'-';
    rows+='<rect x="1" y="'+y+'" width="'+(w-2)+'" height="'+(rowH-3)+'" rx="5" fill="#161b22" stroke="#21262d"/>'
     +'<text x="10" y="'+(y+15)+'" font-size="11" font-family="monospace" font-weight="bold" fill="#c9d1d9">'+esc(p.sym)+'</text>'
     +'<text x="80" y="'+(y+15)+'" font-size="9" font-family="monospace" fill="#8b949e">'+esc(p.sys+' '+p.side)+' e='+p.entry+'</text>'
     +(pct!=null?'<text x="200" y="'+(y+15)+'" font-size="11" font-family="monospace" fill="'+col+'">'+(pct>=0?'+':'')+pct.toFixed(2)+'%</text>':'<text x="200" y="'+(y+15)+'" font-size="9" font-family="monospace" fill="#484f58">no quote</text>')
     +'<text x="270" y="'+(y+15)+'" font-size="9" font-family="monospace" fill="#8b949e">stop+'+toStop+'% tgt-'+toTgt+'% '+esc(String(p.age))+'</text>';});
   if(!pos.length)rows='<text x="14" y="24" font-size="11" font-family="monospace" fill="#484f58">paper book empty</text>';
   const head='<text x="10" y="14" font-size="9" font-family="monospace" fill="#58a6ff">OPEN PAPER POSITIONS ('+pos.length+') - SIM</text>';
   const foot='<text x="'+(w-6)+'" y="'+(h-4)+'" font-size="8" font-family="monospace" fill="#484f58" text-anchor="end">micro-tools &#183; <tspan fill="#58a6ff">'+esc('forge-fax-acquired-second.trycloudflare.com')+'</tspan></text>';
   r.type('image/svg+xml').set('Cache-Control','public,max-age=60').send(svgWrap(w,h,'<rect width="'+w+'" height="'+h+'" fill="#0d1117" rx="8"/>'+head+rows+foot));
  }).catch(()=>r.status(500).send('quotes'));
 }catch(e){r.status(500).send(String(e&&e.message||e));}});

 // /tools/market/desk - one-call machine snapshot: book + journal + regime
 app.get('/tools/market/desk',(q,r)=>{try{bump('freeCalls');logRef(q);
  require('./desk.js').get((e,d)=>{if(e)return r.status(502).json({error:String(e.message||e)});r.type('application/json').set('Cache-Control','public,max-age=60').send(d);});
 }catch(e){r.status(500).send(String(e&&e.message||e));}});
};
