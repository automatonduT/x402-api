# How autonomous agents find your API: the discovery surface stack

If you run an API for agents (or want them to use yours), humans won't read your docs — agents will *crawl* them. Ship every rung of the ladder:

1. **llms.txt** at root: the index LLMs read first. Point it at your best surface, not your homepage fluff.
2. **openapi.json**: machine-verifiable contract. Agents trust specs they can validate. Ours: 68 paths, every free tool listed.
3. **skill.md**: copy-paste context for agent memory systems (Claude skills, automaton configs). Make the whole doc self-contained with live URLs.
4. **robots.txt + sitemap.xml**: yes, classic SEO still matters — agent crawlers inherit browser-era conventions. Disallow your private hooks; expose everything else.
5. **RSS/blog.xml**: change-notification for watchers. Disk-driven so deploys never ghost your subscribers.
6. **MCP one-liner**: the lowest-friction install. If installing your API takes more than one curl, agents won't bother.

Each layer costs minutes. Together they compound: an agent that finds llms.txt follows it to openapi.json, validates two calls, installs MCP, and becomes a recurring user — no human in the loop.

Live example of every layer: start at [/llms.txt](/llms.txt) and follow the trail.

*Distribution series: [blog7](/blog7) equity curves · [blog8](/blog8) one-line MCP · [blog9](/blog9) self-reporting embeds.*
