#!/bin/bash
# newpost.sh v2 NAME "TITLE" < body.md  -> .md + posts.json + public/<slug>.html + ROUTE EXPLICITE dans server.js
NAME="$1"; TITLE="$2"
[ -z "$NAME" ] || [ -z "$TITLE" ] && { echo "usage: newpost.sh NAME \"Title\" < body.md"; exit 1; }
cd "$(dirname "$0")"
cat > "$NAME.md"
node - <<EOF
const fs=require('fs');
let posts=[];try{posts=JSON.parse(fs.readFileSync('posts.json','utf8'))}catch(e){}
if(!posts.find(p=>p.p==="/$NAME")){posts.push({p:"/$NAME",t:"$TITLE",d:new Date().toISOString().slice(0,10),f:"$NAME.md"});
fs.writeFileSync('posts.json',JSON.stringify(posts,null,0));}
// injecte la route explicite si absente
let s=fs.readFileSync('server.js','utf8');
const marker='"/$NAME",(q,r)';
if(!s.includes(marker)){
 const m=s.match(/app\s*=\s*express\(\)/);
 if(m){
  const esc=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const T=${JSON.stringify("$TITLE")};
  const rt=\`app.get("/$NAME",(q,r)=>{try{bump("freeCalls")}catch(e){};let md="";try{md=require("fs").readFileSync(require("path").join(__dirname,"$NAME.md"),"utf8")}catch(e){return r.status(404).send("n/a")}
const esc2=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;");let pre=false;
const body=md.split("\\n").map(l=>{if(/^\`\`\`/.test(l)){pre=!pre;return pre?"<pre>":"</pre>";}if(pre)return esc2(l);
const h=/^(#{1,3})\\\\s+(.*)/.exec(l);if(h)return "<h"+h[1].length+">"+esc2(h[2])+"</h"+h[1].length+">";return "<p>"+esc2(l)+"</p>";}).join("\\n");
r.type("html").send("<!doctype html><meta charset=utf-8><title>"+esc2(md.match(/^#\\s+(.*)/)?.[1]||"$TITLE")+"</title><body style='font-family:system-ui;max-width:720px;margin:2rem auto;padding:0 1rem'><a href=/blog>&larr; blog</a><h1>"+(md.match(/^#\\s+(.*)/)?.[1]||"$TITLE")+"</h1>"+body+"<hr><em>Free tools &amp; desk: <a href=/llms.txt>/llms.txt</a></em></body>");});\`;
  s=s.slice(0,m.index+m[0].length)+"\n"+rt+s.slice(m.index+m[0].length);
  fs.writeFileSync('server.js',s);console.log('route explicite ajoutee pour /$NAME');
 }
}
console.log('published /$NAME ('+JSON.parse(fs.readFileSync('posts.json','utf8')).length+' posts total)');
EOF
{ echo "<!doctype html><meta charset=utf-8><title>$TITLE</title><body style='font-family:system-ui;max-width:720px;margin:2rem auto;padding:0 1rem'><a href=/blog>&larr; blog</a>"; sed -E 's/&/\&amp;/g;s/</\&lt;/g' "$NAME.md" | sed 's/$/<br>/'; echo "</body>"; } > "public/$NAME.html" 2>/dev/null
echo "local:   http://localhost:4020/$NAME"
echo "tunnel:   $(cat .public-base 2>/dev/null)/$NAME"
