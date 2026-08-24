#!/bin/bash
# stats-history.sh - append {ts,free,paid} to data/stats-history.jsonl and print excess-over-self
U="https://skintight-snowcap-underarm.ngrok-free.dev/stats"
J=$(curl -s -m 10 "$U"); F=$(echo "$J" | grep -oE '"free":[0-9]+' | grep -oE '[0-9]+'); P=$(echo "$J" | grep -oE '"paid":[0-9]+' | grep -oE '[0-9]+')
[ -z "$F" ] && { echo "STATS_FETCH_FAIL"; exit 1; }
printf '{"ts":"%s","free":%s,"paid":%s}\n' "$(date -u +%FT%TZ)" "$F" "${P:-0}" >> data/stats-history.jsonl
LAST=$(tail -2 data/stats-history.jsonl | head -1)
LF=$(echo "$LAST" | grep -oE '"free":[0-9]+' | grep -oE '[0-9]+')
D=$(( ${F:-0} - ${LF:-0} )); SP=$(awk "{s+=\$1} END{print s+0}" "$HOME/automaton-work/x402-api/data/scans-pending" 2>/dev/null); : > "$HOME/automaton-work/x402-api/data/scans-pending" 2>/dev/null; EXCESS=$(( D - SP - 1 > 0 ? D - SP - 1 : 0 ))
echo "DELTA=$D SELF_EXPECTED=1 EXTERNAL_ESTIMATE=$EXCESS"
