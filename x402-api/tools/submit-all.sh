#!/bin/bash
# submit-all.sh — UNE commande qui débloque toute la distribution quand les creds arrivent.
# Prérequis: export GITHUB_REPO="github.com/<handle>/x402-api"
set -u
BASE="https://skintight-snowcap-underarm.ngrok-free.dev"
LOG="../SUBMISSIONS.log"; stamp(){ date -u +%FT%TZ; }
[ "${GITHUB_REPO:-}" = "" ] && { echo "ABORT: GITHUB_REPO non défini (creds créateur #6 requises)"; exit 1; }
DESC="29 API tools (free + paid via x402/USDC on Base) + free endpoint inspector classifying PAYABLE / 402_SANS_ACCEPTS / FREE_OR_OPEN / HTTP_x. Live metrics, no estimates."
say(){ echo "[$(stamp)] $1" >> "$LOG"; echo "$1"; }
# 1) mcpfinder (mcp.directory)
R=$(curl -s -o /tmp/mf.out -w '%{http_code}' -m 20 -X POST https://mcpfinder.xyz/submit \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"automaton-alpha x402 toolkit\",\"repoUrl\":\"https://$GITHUB_REPO\",\"email\":\"titouanautomaton@proton.me\",\"description\":\"$DESC\"}")
say "mcpfinder POST=$R $(head -c 80 /tmp/mf.out)"
# 2) smithery
R=$(curl -s -o /tmp/sm.out -w '%{http_code}' -m 20 -X POST https://registry.smithery.ai/servers \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"automaton-alpha-tools\",\"repo\":\"$GITHUB_REPO\",\"description\":\"$DESC\"}")
say "smithery POST=$R $(head -c 80 /tmp/sm.out)"
# 3) glama
R=$(curl -s -o /tmp/gl.out -w '%{http_code}' -m 20 -X POST https://glama.ai/api/mcp/v1/submit \
  -H 'Content-Type: application/json' \
  -d "{\"repo\":\"$GITHUB_REPO\"}")
say "glama POST=$R $(head -c 80 /tmp/gl.out)"
# 4) x402scan (route réelle découverte ce cycle: /submitted ; /submit=404)
R=$(curl -s -o /tmp/xs.out -w '%{http_code}' -m 20 -X POST https://www.x402scan.com/api/submit \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"$BASE\",\"manifest\":\"$BASE/.well-known/x402-manifest.json\",\"contact\":\"titouanautomaton@proton.me\"}")
say "x402scan POST=$R $(head -c 80 /tmp/xs.out)"
say "DONE — vérifier chaque code; si endpoint 404, extraire le vrai depuis le bundle JS de la page /submitted."
