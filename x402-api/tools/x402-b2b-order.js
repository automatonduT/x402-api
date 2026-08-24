// x402-b2b-order.js v2 - captage commandes audit B2B - gratuit - honore le tiers promis par pricing.html
const express=require("express"),fs=require("fs"),path=require("path");
const LOG=path.join(__dirname,"..","b2b-orders.jsonl");
module.exports.freeR=express.Router().post("/tools/b2b/order",(q,r)=>{
  const b=q.body||{};
  const tier=String(b.tier||"standard").toLowerCase()==="premium"?"premium":"standard";
  const maxUrls=tier==="premium"?25:5;
  const urls=Array.isArray(b.urls)?b.urls.filter(u=>/^https?:\/\//.test(String(u))):[];
  const contact=String(b.contact||"").trim().slice(0,200);
  if(!urls.length)return r.status(400).json({error:"body JSON requis: {contact, urls:[1-"+maxUrls+" http(s)], tier?:\"standard\"|\"premium\", notes?}",example:{contact:"you@team.com",urls:["https://api.example.com/paid"],tier:"standard"}});
  if(!contact)return r.status(400).json({error:"contact requis (email ou handle)"});
  const kept=urls.slice(0,maxUrls), dropped=urls.length-kept.length;
  const id="b2b-"+Date.now().toString(36);
  try{fs.appendFileSync(LOG,JSON.stringify({id,ts:new Date().toISOString(),tier,priceUsd:tier==="premium"?25:5,contact,urls:kept,dropped,notes:String(b.notes||"").slice(0,500)})+"\n")}catch(e){}
  r.json({ok:true,orderId:id,tier,priceUsd:tier==="premium"?25:5,received:{urls:kept.length,droppedOverCap:dropped},
  nextSteps:["manual deep-audit of each URL (same engine guarding our own paywalls)",tier==="premium"?"written report within 6h + re-audit after your fix within 7 days":"written report per URL within 24h","payment AFTER delivery - not satisfied = tell us why, owe nothing"],
  checkStatus:"reply to ERC-8004 agent #67574 with your orderId",by:"micro-tools automaton-alpha ERC-8004 #67574"});
});
