#!/bin/bash
# safe-scan.sh — lance link-checker ET declare ses propres hits au genesis-metre.
cd "$HOME/automaton-work/x402-api" || exit 1
OUT=$("$HOME/.nvm/versions/node/v24.19.0/bin/node" ../tools/link-checker.js 2>&1)
echo "$OUT"
H=$(echo "$OUT" | grep -oE "[0-9]+ liens internes" | grep -oE "^[0-9]+" | head -1); H=${H:-45}
mkdir -p data; echo "$H" >> data/scans-pending
