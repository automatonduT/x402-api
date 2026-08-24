#!/bin/bash
# door.sh - resilient public door: ensure binary, start quick tunnel, migrate refs if URL changed
set -u
DIR="$HOME/automaton-work/x402-api"
OLD_BASE="https://forge-fax-acquired-second.trycloudflare.com"
LOG="$DIR/pipeline.log"; ts(){ date -u +%FT%TZ; }
say(){ echo "$(ts) door: $*" >> "$LOG"; }
if ! command -v cloudflared >/dev/null 2>&1; then
  OS=$(uname -s); ARCH=$(uname -m)
  case "$OS/$ARCH" in
    Darwin/arm64) ASSET=cloudflared-darwin-arm64.tgz ;;
    Darwin/x86_64) ASSET=cloudflared-darwin-amd64.tgz ;;
    Linux/x86_64) ASSET=cloudflared-linux-amd64 ;;
    Linux/aarch64) ASSET=cloudflared-linux-arm64 ;;
    *) say "unsupported os $OS/$ARCH"; exit 1 ;;
  esac
  say "installing cloudflared ($ASSET)"
  mkdir -p "$HOME/.local/bin"
  if [[ $ASSET == *.tgz ]]; then
    curl -sSL "https://github.com/cloudflare/cloudflared/releases/latest/download/$ASSET" -o /tmp/cf.tgz \
      && tar -xzf /tmp/cf.tgz -C /tmp cloudflared && mv /tmp/cloudflared "$HOME/.local/bin/cloudflared"
  else
    curl -sSL "https://github.com/cloudflare/cloudflared/releases/latest/download/$ASSET" -o "$HOME/.local/bin/cloudflared"
  fi
  chmod +x "$HOME/.local/bin/cloudflared"; export PATH="$HOME/.local/bin:$PATH"
fi
command -v cloudflared >/dev/null 2>&1 || { say "cloudflared unavailable"; exit 1; }
pkill -f "cloudflared tunnel" 2>/dev/null; sleep 1
nohup cloudflared tunnel --url http://localhost:4020 > "$DIR/tunnel.log" 2>&1 &
say "tunnel starting (pid $!)"
NEW=""
for i in $(seq 1 30); do
  NEW=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$DIR/tunnel.log" | head -1)
  [ -n "$NEW" ] && break; sleep 2
done
[ -z "$NEW" ] && { say "no tunnel URL captured"; exit 1; }
say "tunnel up: $NEW"
if [ "$NEW" != "$OLD_BASE" ]; then
  say "MIGRATING base $OLD_BASE -> $NEW"
  grep -rl --exclude-dir=node_modules --exclude=door.sh --exclude=tunnel.log --exclude='server.log*' "$OLD_BASE" "$DIR" 2>/dev/null | while read -r f; do
    sed -i.bak "s|$OLD_BASE|$NEW|g" "$f" && rm -f "$f.bak"
  done
  for f in "$HOME/automaton-work/measure.sh"; do
    [ -f "$f" ] && grep -q "$OLD_BASE" "$f" && sed -i.bak "s|$OLD_BASE|$NEW|g" "$f" && rm -f "$f.bak"
  done
  ( cd "$DIR" && ./gen-llms-full.sh >/dev/null 2>&1; git add -A; git commit -q -m "door: migrate public base to $NEW" )
  say "migration committed"
fi
echo "$NEW" > "$DIR/.public-base"
say "door OK: $NEW"
