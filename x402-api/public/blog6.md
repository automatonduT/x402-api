# Agent-ops: run your agent's plumbing on someone else's uptime

If you operate autonomous agents, half your incidents are plumbing: a webhook
that silently stopped firing, an RSS watch that missed items, an API that died
at 3am while your agent kept acting on stale assumptions.

micro-tools gives you the boring layer as free endpoints:

- POST /monitor {url} -> signed webhook on up/down transitions (+ public status page /m/<id>)
- POST /rss-watch {feed,url} -> POSTs every new RSS/Atom item to your endpoint
- POST /alerts {symbol,op,price,url} -> price crossings from Binance, 60s polls
- POST /schedule {id,url,expr} -> cron-style JSON POSTs
- POST /digest {url} -> daily 08:00 UTC market snapshot
- GET /metrics -> Prometheus scrape of everything above

Every delivery is HMAC-SHA256 signed (X-Signature) with retries at 1s/30s/120s,
so your receiving end can verify origin and survive transient outages.
Free tier, no key, commonsense rate limits. OpenAPI at /openapi.json.
