#!/bin/sh
# micro-tools shell client - usage: mt <cmd> [args]
B="${MICROTOOLS_BASE:-https://completely-contrast-corporations-decorative.trycloudflare.com}"
case "$1" in
  uuid)    curl -sS "$B/tools/uuid?n=${2:-1}";;
  hash)    curl -sS "$B/tools/hash?data=$2&algo=sha256";;
  b64e)    curl -sS "$B/tools/base64?text=$2&mode=e";;
  slug)    curl -sS "$B/tools/slugify?text=$2";;
  time)    curl -sS "$B/tools/time";;
  cron)    curl -sS "$B/tools/cron/next?expr=$2&n=3";;
  quote)   curl -sS "$B/tools/market/quote?symbol=${2:-BTCUSDT}";;
  signal)  curl -sS "$B/tools/market/signal?kind=momentum&symbol=${2:-BTCUSDT}";;
  corr)    curl -sS "$B/tools/market/correlation?symbols=${2:-BTCUSDT,ETHUSDT,SOLUSDT}";;
  feed)    curl -sS "$B/tools/market/feed?take=10";;
  sample)  curl -sS "$B/premium/sample";;
  status)  curl -sS "$B/stats"; curl -sS "$B/metrics" | head -20;;
  openapi) curl -sS "$B/openapi.json";;
  *) echo "cmds: uuid hash b64e slug time cron quote signal corr feed sample status openapi";;
esac
