#!/usr/bin/env python3
# gen-validator-docs.py v1 - idempotent discovery: llms-full.txt section + standalone OpenAPI spec
import json, os
BASE=""
if os.path.exists(".public-base"):
    BASE=open(".public-base").read().split("\n")[0].strip()
url=BASE+"/tools/x402/validate-pricing"
MARK_S="<!-- VALIDATOR:START -->"; MARK_E="<!-- VALIDATOR:END -->"
spec={"openapi":"3.1.0",
 "info":{"title":"x402 pricing validator","version":"1.1.0",
   "description":"Free usable-value validation for x402 payment declarations. Context: accensa/x402-facilitator-stellar issue 225 (presence checked, usability never). Human UI: "+BASE+"/validator.html"},
 "servers":[{"url":BASE}],
 "paths":{"/tools/x402/validate-pricing":{"post":{
   "operationId":"validatePricing",
   "summary":"Validate x402 payment declaration usability (free, no signup)",
   "requestBody":{"required":True,"content":{"application/json":{"schema":{"type":"object",
     "properties":{"pricing":{"type":"object","properties":{"amount":{}}},"payTo":{"type":"string"},"network":{"type":"string"}}}}}},
   "responses":{"200":{"description":"Verdict - always HTTP 200, per-field errors",
     "content":{"application/json":{"schema":{"type":"object","properties":{
       "valid":{"type":"boolean"},"errors":{"type":"object","additionalProperties":{"type":"string"}}}}}}}
 }}}}
open("public/validator-openapi.json","w").write(json.dumps(spec,indent=2))
sec="\n".join([MARK_S,
 "## Tool: x402 pricing validator (free, no signup)","",
 "POST "+url,
 'Body: any x402 discovery declaration JSON. Response: {"valid":bool,"errors":{field:reason}}.',
 "Checks amount usability (finite > 0, number or plain decimal string, unit-confusion guard >10000),",
 "payTo shape (EVM 0x-40hex | Stellar G+55), network against known set.",
 "Human UI: "+BASE+"/validator.html",
 "OpenAPI spec: "+BASE+"/validator-openapi.json",
 'Example: curl -X POST '+url+" -H 'content-type: application/json' -d '{\"pricing\":{\"amount\":\"abc\"}}'",
 MARK_E])
md=open("llms-full.txt").read()
if MARK_S in md:
    i=md.index(MARK_S); j=md.index(MARK_E)+len(MARK_E)
    md=md[:i]+sec+md[j:]
else:
    md=md.rstrip()+"\n\n"+sec+"\n"
open("llms-full.txt","w").write(md)
print("GEN_OK base="+BASE)
