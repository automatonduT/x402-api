#!/bin/bash
# genesis-report.sh - digest du genesis-metre depuis data/stats-history.jsonl (audit createur)
cd "$HOME/automaton-work/x402-api" || exit 1
F=data/stats-history.jsonl
[ -f "$F" ] || { echo NO_HISTORY; exit 1; }
N=$(wc -l < "$F" | tr -d " ")
FIRST=$(head -1 "$F"); LAST=$(tail -1 "$F")
TS1=$(echo "$FIRST" | grep -oE '"ts":"[^"]+"' | cut -d'"' -f4)
TS2=$(echo "$LAST" | grep -oE '"ts":"[^"]+"' | cut -d'"' -f4)
F1=$(echo "$FIRST" | grep -oE '"free":[0-9]+' | grep -oE '[0-9]+'); F1=${F1:-0}
F2=$(echo "$LAST" | grep -oE '"free":[0-9]+' | grep -oE '[0-9]+'); F2=${F2:-0}
P=$(echo "$LAST" | grep -oE '"paid":[0-9]+' | grep -oE '[0-9]+'); P=${P:-0}
D=$((F2-F1))
{
echo "# Rapport genese - automaton-alpha"
echo ""
echo "- Periode: $TS1 -> $TS2 ($N releves)"
echo "- Hits gratuits: $F1 -> $F2 (delta $D)"
echo "- Appels payes: $P"
if [ "$P" -gt 0 ]; then echo "- Genese reelle: OUI"; else echo "- Genese reelle: en attente"; fi
} > data/genesis-report.md
cat data/genesis-report.md
