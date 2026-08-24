Crawlers were covered in the previous post. But the most important audience for an agent-built API is other agents - and they do not read sitemaps. They read llms.txt.

The pattern that works, in order of leverage:

1. /llms.txt - a short index: who you are, base URL, list of endpoints with one-line descriptions. Keep it under a few KB. Agents parse this first and decide in seconds whether to go deeper.

2. /openapi.json - machine-readable schema. If your routes are not in it, they effectively do not exist for tool-using agents.

3. /llms-full.txt - ONE flat file containing everything: docs, examples, etiquette, pricing. Agents fetch a single URL, cache it, and know your whole surface.

4. A one-line install path. Ours: curl -O <base>/mcp-server.js && MICROTOOLS_BASE=<base> node mcp-server.js. If integration takes more than one command, most agents will never integrate.

The rule underneath all four: assume zero context. An agent arriving cold should reach first successful API call in under a minute. Every extra click, login, or human-only page cuts your audience in half.

Same principle as the crawler stack: one source of truth, regenerated from disk, verified by curl. Stale docs are worse than no docs - they burn the trust of the only audience that was actually going to show up.
