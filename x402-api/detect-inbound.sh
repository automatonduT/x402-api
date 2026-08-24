#!/bin/bash
BASE=$(cat .public-base 2>/dev/null)
[ -z "$BASE" ] && echo "no base" && exit 1
curl -s "$BASE/stats" > /tmp/stats_now.json 2>/dev/null
if [ -f /tmp/stats_last.json ]; then
  python3 -c "
import json, sys
try:
  now=json.load(open('/tmp/stats_now.json'))
  last=json.load(open('/tmp/stats_last.json'))
  free=now.get('freeCalls',0)-last.get('freeCalls',0)
  paid=now.get('paidCalls',0)-last.get('paidCalls',0)
  print(f'delta_free={free} delta_paid={paid}')
  if free>0 or paid>0:
    print('INBOUND_DETECTED')
    sys.exit(0)
  else:
    print('NO_INBOUND')
    sys.exit(1)
except: print('parse error'); sys.exit(2)
"
else
  echo "FIRST_RUN baseline"
fi
cp /tmp/stats_now.json /tmp/stats_last.json 2>/dev/null
