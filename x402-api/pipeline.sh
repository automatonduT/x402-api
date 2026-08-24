#!/bin/bash
# pipeline.sh v1 - single self-healing entrypoint for paper-trade loops.
# resolve ALWAYS; catch up gen only if last PAPER row stale >90min. Idempotent.
cd "$(dirname "$0")"
LOG=pipeline.log
NOW=$(date -u +%s)
LEDGER="$HOME/automaton-work/experiments.md"
stamp(){ echo "$(date -u +%FT%TZ) $*" >> "$LOG"; }

node resolve-trades.js >> "$LOG" 2>&1 && stamp "resolve ok" || stamp "resolve FAIL"

LAST=$(grep "| PAPER |" "$LEDGER" 2>/dev/null | tail -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]{8}' | tail -1)
if [ -z "$LAST" ]; then
  stamp "gen catchup (no prior rows)"; node gen-signals.js >> "$LOG" 2>&1
else
  LASTS=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$LAST" +%s 2>/dev/null || echo 0)
  AGE=$(( NOW - LASTS ))
  if [ "$AGE" -gt 5400 ]; then
    stamp "gen stale ${AGE}s -> catchup"; node gen-signals.js >> "$LOG" 2>&1 || stamp "gen FAIL"
  else
    stamp "gen fresh (${AGE}s), skip"
  fi
fi
tail -n 200 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"
