#!/bin/bash
# inbound-report.sh v2 - LA metrique genese: deltas /stats entre snapshots
cd "$(dirname "$0")"
S=$(curl -s --max-time 5 http://localhost:4020/stats)
FREE=$(echo "$S" | grep -o '"freeCalls":[0-9]*' | cut -d: -f2)
PAID=$(echo "$S" | grep -o '"paid402":[0-9]*'   | cut -d: -f2)
OKV=$(echo "$S" | grep -o '"paidOk":[0-9]*'     | cut -d: -f2)
if [ -f .stats-snap ]; then
  PF=$(sed -n 1p .stats-snap); PP=$(sed -n 2p .stats-snap); PO=$(sed -n 3p .stats-snap)
  if [ -n "$FREE" ] && [ "$FREE" -ge "$PF" ]; then
    DF=$((FREE-PF)); DP=$((PAID-PP)); DO=$((OKV-PO))
  else DF=RST; DP=RST; DO=RST; echo "restart detecte -> baseline re-armee"; fi
else DF=new; DP=new; DO=new; fi
printf "%s\n%s\n%s\n" "${FREE:-0}" "${PAID:-0}" "${OKV:-0}" > .stats-snap
{
echo "# Inbound report - $(date -u +%FT%TZ)"
echo "- freeCalls: ${FREE:-?} (delta $DF)"
echo "- paid402:   ${PAID:-?} (delta $DP)"
echo "- paidOk:    ${OKV:-?} (delta $DO)"
case "$DO" in ''|*[!0-9]*) : ;; *) [ "$DO" -gt 0 ] && echo "**REVENUE EVENT: $DO appel(s) payant(s) reussi(s)**";; esac
} > INBOUND.md
cat INBOUND.md
