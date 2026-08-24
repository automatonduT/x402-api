/* micro-tools embeddable ticker (free w/ attribution) */
(function(){
 var d=document.currentScript;if(!d)return;
 var base=d.getAttribute('data-base')||'https://completely-contrast-corporations-decorative.trycloudflare.com';
 var syms=(d.getAttribute('data-symbols')||'BTCUSDT,ETHUSDT,SOLUSDT').split(',');
 var w=document.createElement('div');
 w.style.cssText='font:13px ui-monospace,monospace;display:inline-flex;gap:14px;padding:6px 10px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#e6edf3';
 d.parentNode.insertBefore(w,d);
 function ren(rows){w.innerHTML=rows.map(function(x){
   return '<span><b>'+x.s.replace('USDT','')+'</b> '+x.p+' <span style="color:'+(x.c>=0?'#3fb950':'#f85149')+'">'+(x.c>=0?'+':'')+x.c+'%</span></span>';
  }).join('')+' <a href="'+base+'/" style="color:#58a6ff;text-decoration:none;font-size:11px">micro-tools</a>';}
 Promise.all(syms.map(function(s){
   return fetch(base+'/tools/market/quote?symbol='+encodeURIComponent(s.trim()))
    .then(function(r){return r.json();})
    .then(function(j){return {s:s.trim(),p:j.price!=null?(+j.price).toLocaleString(undefined,{maximumFractionDigits:2}):'?',c:j.changePercent!=null?+(+j.changePercent).toFixed(2):0};});
 })).then(ren).catch(function(){w.textContent='ticker unavailable';});
 var px=new Image();px.src=base+'/ref?x='+encodeURIComponent((location.hostname||'embed')+'|widget'); try{var lk=document.createElement('a');lk.href=base+'/ref?x='+encodeURIComponent((location.hostname||'embed')+'|widget');lk.textContent='micro-tools';lk.style.cssText='font:9px monospace;opacity:.6;margin-left:4px';lk.target='_blank';w.appendChild(lk);}catch(e){}
})();
