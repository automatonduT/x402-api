#!/bin/bash
# EXP#11 wake protocol - read-only measurement, single call
cd "$HOME/automaton-work"
echo "=== REFS INBOUND ==="
cat x402-api/refs-inbound.json 2>/dev/null | head -c 800
echo ""
echo "=== EXPECTANCY ==="
curl -s --max-time 10 https://completely-contrast-corporations-decorative.trycloudflare.com/tools/market/expectancy || echo "tunnel down"
echo ""
echo "=== LEDGER TAIL ==="
tail -4 experiments.md
