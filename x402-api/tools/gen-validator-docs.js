#!/usr/bin/env node
// gen-validator-docs.js v2 - idempotent discovery: llms-full.txt section + standalone OpenAPI spec
const fs=require("fs");
const BASE=(fs.existsSync(".public-base")?fs.readFileSync(".public-base","utf8").split("\n")[0]:"").trim();
const url=BASE+"/tools/x402/validate-pricing";
const MARK_S="<!-- VALIDATOR:START -->", MARK_E="<!-- VALIDATOR:END -->";
const spec={
 openapi:"3.1.0",
 info:{title:"x402 pricing validator",version:"1.1.0",
   description:"Free usable-value validation for x402 payment declarations. Context: accensa/x402-facilitator-stellar issue 225 (presence checked, usability never). Human UI: "+BASE+"/validator.html"},
 servers:[{url:BASE}],
 paths:{"/tools/x402/validate-pricing":{post:{
   operationId:"validatePricing",
   summary:"Validate x402 payment declaration usability (free, no signup)",
   requestBody:{required:true,content:{"application/json":{schema:{type:"object",
     properties:{pricing:{type:"object",properties:{amount:{}}},payTo:{type:"string"},network:{type:"string"}}}}}},
   responses:{"200":{description:"Verdict - always HTTP 200, per-field errors",
     content:{"application/json":{schema:{type:"object",properties:{
       valid:{type:"boolean"},errors:{type:"object",additionalProperties:{type:"string"}}}}}}}
 }}}};
fs.writeFileSync("public/validator-openapi.json",JSON.stringify(spec,null,2));
const sec=[MARK_S,
 "## Tool: x402 pricing validator (free, no signup)","",
 "POST "+url,
 'Body: any x402 discovery declaration JSON. Response: {"valid":bool,"errors":{field:reason}}.',
 "Checks amount usability (finite > 0, number or plain decimal string, unit-confusion guard >10000),",
 "payTo shape (EVM 0x…40hex | Stellar G+55), network against known set.",
 "Human UI: "+BASE+"/validator.html",
 "OpenAPI spec: "+BASE+"/validator-openapi.json",
 "Example: curl -X POST "+url+" -H 'content-type: application/json' -d '{\"pricing\":{\"amount\":\"abc\"}}'",
 MARK_E].join("\n");
let md=fs.readFileSync("llms-full.txt","utf8");
if(md.includes(MARK_S)) md=md.replace(new RegExp(MARK_S.replace(/[*/]/g,"\\$&")+"[\\s\\S]*?"+MARK_E),sec);
else md=md.trimEnd()+"\n\n"+sec+"\n";
fs.writeFileSync("llms-full.txt",md);
console.log("GEN_OK base="+BASE);
