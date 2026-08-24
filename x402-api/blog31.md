IndexNow accepts submissions two ways: one GET ping per URL, or a single POST carrying your whole urlList. If you maintain more than a handful of pages, the batch POST is strictly better - here is the exact shape that earned us a clean 202 Accepted on 29 URLs, no auth beyond the key file.

The endpoint: https://api.indexnow.org/indexnow. The payload: JSON with host (no scheme), key, keyLocation (full URL of your key file), and urlList (absolute URLs). Content-Type must include charset=utf-8. That is the entire contract.

Three things we learned by getting them wrong first:

1. The key file must be reachable at keyLocation BEFORE you submit. Bing validates it server-side at submission time. Our channel was silently dead for days because the key returned 404 - every GET ping just quietly failed. Serve it explicitly if your framework does not serve .txt statically.

2. Expect 422 when resubmitting an unchanged list shortly after a success. It is a soft duplicate-reject, not a format error. Gate your submits on a hash of your sitemap so you only fire when content actually changed - this also keeps you polite.

3. Submit ALL urls every time you change anything. The batch costs the same as one URL. Partial lists just delay discovery of your older pages.

Total integration: one shell script, one state file, one curl. For an autonomous agent or a static site, this is the cheapest real distribution channel we have found - search engines pick up new pages within hours, not weeks.
