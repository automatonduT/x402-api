#!/usr/bin/env bash
# refresh-oos.sh [v1] - donnees fraiches -> verdicts OOS -> json public -> table html (idempotent)
set -u
cd "$(dirname "$0")/.."
NB=$(ls $HOME/.nvm/versions/node/*/bin/node 2>/dev/null | head -1)
[ -z "$NB" ] && { echo "NO_NODE"; exit 1; }
mkdir -p data
for S in BTC ETH SOL BNB XRP; do
  F="data/${S}USDT-1d.csv"
  $NB ../tools/fetch-history.js ${S}USDT 1d 1000 "$F" >/dev/null 2>&1 || echo "FETCH_FAIL $S"
done
python3 - <<'PY'
import json,subprocess,os,datetime,re
nb=os.path.expanduser("~/.nvm/versions/node/v24.19.0/bin/node")
out={"generated":datetime.datetime.utcnow().isoformat()+"Z",
 "agent":"automaton-alpha ERC-8004 #67574",
 "method":"IS/OOS split 70/30, signals executed NEXT OPEN (zero look-ahead). edge=PASS requires OOS retPct>0 AND winRate>=40 AND n>=10. Strategies: turtle_s1(20/10), turtle_s2(55/20), momentum(sma50+rsi14), turtle_s1_atr(S1 entry, trailing stop 2*ATR14).",
 "disclaimer":"SIMULATION ONLY - not financial advice. FAILS are published as-is: honesty is the feature.",
 "symbols":{}}
for s in ["BTC","ETH","SOL","BNB","XRP"]:
    f=f"data/{s}USDT-1d.csv"
    if not os.path.exists(f):continue
    r=subprocess.run([nb,"tools/backtest.js",f],capture_output=True,text=True)
    if r.returncode==0:
        try:out["symbols"][s+"USDT"]=json.loads(r.stdout)
        except Exception:pass
open("public/oos-verdict.json","w").write(json.dumps(out,indent=1))
strats=["turtle_s1","turtle_s2","momentum","turtle_s1_atr"]
P=[]
P.append('<div id="oos-real-table" style="margin-top:1.5rem">')
P.append('<h2>Real verdicts (live engine output, FAILs included)</h2>')
P.append('<p style="font-size:.9em">OOS window only - generated '+out["generated"][:10]+' - <a href="/oos-verdict.json">raw JSON</a></p>')
head='<tr><th>Asset</th>'+''.join('<th>'+st+'</th>' for st in strats)+'</tr>'
P.append('<table style="border-collapse:collapse;font-size:.82em">'+head)
for sym,res in out["symbols"].items():
    row='<tr><td><strong>'+sym+'</strong></td>'
    for st in strats:
        node=res.get("strategies",{}).get(st,{})
        o=node.get("oos",{});edge=node.get("edge","?")
        color="#1a7f37" if edge=="PASS" else "#d1242f"
        row+='<td style="color:'+color+'">'+str(o.get("retPct","?"))+'% / WR '+str(o.get("winRate","?"))+'% / n='+str(o.get("n","?"))+' <strong>'+str(edge)+'</strong></td>'
    row+='</tr>';P.append(row)
P.append('</table>')
P.append('<p style="font-size:.85em;color:#57606a">Format: OOS return % / win rate / trades. PASS requires retPct&gt;0 AND WR&#8805;40 AND n&#8805;10 out-of-sample. Zero look-ahead: signals execute at next open.</p>')
P.append('</div>')
table="\n".join(P)+"\n"
p="public/oos.html";src=open(p).read()
if 'id="oos-real-table"' in src:
    i=src.index('<div id="oos-real-table"');j=src.index("</div>",src.index("</table>",i))+len("</div>")
    src=src[:i]+table+src[j:]
else:
    src=src.replace("</body>",table+"</body>",1)
open(p,"w").write(src)
tot=sum(len(v.get("strategies",{})) for v in out["symbols"].values())
print("REFRESH_OK symbols=%d results=%d"%(len(out["symbols"]),tot))
PY
echo "$(date -u +%FT%TZ) refreshed" >> data/oos-refresh.log
