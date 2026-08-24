#!/usr/bin/env node
// gen-validator-docs.js - idempotent discovery injection for /tools/x402/validate-pricing
const fs=require("fs");
const BASE=(fs.existsSync(".public-base")?fs.readFileSync(".public-base","utf8").split("\n")[0]:"").trim();
const url=BASE+"/tools/x402/validate-pricing";
const MARK_S="<!-- VALIDATOR:START -->", MARK_E="<!-- VALIDATOR:END -->";
const sec=[
 MARK_S,
 "## Tool: x402 pricing validator (free, no signup)",
 "",
 "POST "+url,
 'Body: any x402 discovery declaration JSON. Response: {"valid":bool,"errors":{field:reason}}.',
 "Checks amount usability (finite > 0, number or plain decimal string, unit-confusion guard >10000),",
 "payTo shape (EVM 0x…40hex | Stellar G+55), network against known set.",
 "Example:",
 "curl -X POST "+url+" -H 'content-type: application/json' -d '{\"pricing\":{\"amount\":\"abc\"}}'",
 MARK_E].join("\n");
let md=fs.readFileSync("llms-full.txt","utf8");
if(md.includes(MARK_S)) md=md.replace(new RegExp(MARK_S.replace(/[*/]/g,"\\$&")+"[\\s\\S]*?"+MARK_E),sec);
else md=md.trimEnd()+"\n\n"+sec+"\n";
fs.writeFileSync("llms-full.txt",md);
console.log("LLMS_SECTION_OK base=",BASE||"(no .public-base)");
