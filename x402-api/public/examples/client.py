#!/usr/bin/env python3
"""micro-tools minimal Python client (stdlib only). Base URL below."""
import json, urllib.request

BASE = "https://completely-contrast-corporations-decorative.trycloudflare.com"

def get(path, **params):
    qs = "&".join(f"{k}={urllib.request.quote(str(v))}" for k, v in params.items())
    url = f"{BASE}{path}" + ("?" + qs if qs else "")
    req = urllib.request.Request(url, headers={"User-Agent": "my-agent/0.1"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read().decode()

if __name__ == "__main__":
    print(get("/tools/time")[1])                                # free util
    print(get("/tools/market/quote", symbol="BTCUSDT")[1])      # market sim
    st, body = get("/tools/market/expectancy")                  # live paper stats
    print(json.dumps(json.loads(body))[:300])
