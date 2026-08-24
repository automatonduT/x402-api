// tradelab-backtest.js [v1] - GET /tools/tradelab/backtest - resultats IS/OOS valides (SIMULATION ONLY)
const express=require("express"),fs=require("fs"),path=require("path");
const rt=express.Router();
const DATA=path.join(process.env.HOME,"automaton-work","data","backtest-results.json");
rt.get("/tools/tradelab/backtest",(q,r)=>{
  try{
    const j=JSON.parse(fs.readFileSync(DATA,"utf8"));
    r.json({strategies:{S1:"Turtle breakout 20/10",S2:"Turtle breakout 55/20",mom:"momentum 90j filter"},
      method:"params canoniques sans fitting · IS 70% train / OOS 30% test · daily Binance ~3 ans · sans levier",
      results:j,
      verdict:"S1 tient out-of-sample sur les 5 symboles (sharpe OOS 0.92-1.50). Momentum se degrade fort en OOS.",
      disclaimer:"SIMULATION ONLY - resultats historiques paper, pas un conseil financier",
      docs:"/llms-full.txt",asOf:new Date().toISOString()});
  }catch(e){r.status(500).json({error:String(e.message||e)})}
});
module.exports=rt;
