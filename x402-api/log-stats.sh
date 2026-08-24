#!/bin/bash
cd "$HOME/automaton-work/x402-api"
S=$(curl -s --max-time 5 http://localhost:4020/stats || echo '{}')
echo "| auto | $(date -u +%FT%TZ) | stats snapshot | - | - | $S |" >> "$HOME/automaton-work/experiments.md"
