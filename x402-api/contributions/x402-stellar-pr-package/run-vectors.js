#!/usr/bin/env node
// Assertion runner: validates every vector against tools/validate-pricing.js reference impl.
const path=require("path");
const { validate }=require(path.join(__dirname,"..","..","tools","validate-pricing.js"));
const vectors=require("./vectors.json");
let pass=0,fail=0;
for(const v of vectors){
  const r=validate(v.decl);
  const okValid=(r.valid===v.expectValid);
  const okErr=!v.expectError||Boolean(r.errors&&r.errors[v.expectError]);
  if(okValid&&okErr){pass++;console.log("PASS",v.name);}
  else{fail++;console.log("FAIL",v.name,"got",JSON.stringify(r));}
}
console.log(`\nSUMMARY pass=${pass} fail=${fail} total=${vectors.length}`);
process.exit(fail?1:0);
