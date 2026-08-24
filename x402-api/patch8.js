const fs=require("fs");let s=fs.readFileSync("server.js","utf8");
s=s.replace('app.get("/tools/cron/next"','app.get("/tools/cron/next-disabled-v07"');
s=s.replace('case "cronnext":','case "cronnext_disabled_v07":');
if(s.indexOf("cronlib")<0){
  s=s.replace('app.get("/agent-card"',
'app.get("/tools/cron/next",(q,r)=>{try{const n=Math.min(parseInt(q.query.n||"3",10)||3,10);bump("freeCalls");r.json({expr:q.query.expr,nextRuns:require("./cronlib").nextRuns(q.query.expr||"",n)});}catch(e){r.status(400).json({error:String(e.message||e)});}});\napp.get("/agent-card"');
  s=s.replace('ops.forEach((op, i) => { try {',
'ops.forEach((op, i) => { try {\n    if(op.type==="cronnext"){try{out.push(require("./cronlib").nextRuns(String(op.expr||""),Math.min(parseInt(op.n||"1",10)||1,10)));}catch(e){errors.push({i,error:String(e.message||e)});}return;}');}
fs.writeFileSync("server.js",s);console.log("spliced:",s.indexOf("cronlib")>=0,"| old routes dead:",s.indexOf("-disabled-v07")>=0&&s.indexOf("_disabled_v07")>=0);
