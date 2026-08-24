#!/bin/bash
# pr-watch.sh v1 - etat de la PR canonique #1317 (declencheur publication ep11)
# sortie attribuable uniquement: PR_STATE=OPEN|MERGED|CLOSED|UNKNOWN
set -u
REPO="xpaysh/awesome-x402"; NUM="1317"
N="$HOME/.nvm/versions/node/v24.19.0/bin/node"
D=$(curl -sS --max-time 12 "https://api.github.com/repos/${REPO}/pulls/${NUM}" 2>/dev/null)
echo "$D" | "$N" -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
try{const j=JSON.parse(d);
const st=j.merged?"MERGED":(j.state==="closed"?"CLOSED":"OPEN");
console.log("PR_STATE="+st+" merged="+!!j.merged+" comments="+j.comments+" updated="+j.updated_at);}
catch(e){console.log("PR_STATE=UNKNOWN parse_error");}});'
