# llms-full.txt: let agents ingest your whole site in ONE fetch

[blog10](/blog10) shipped the discovery ladder: llms.txt as index, then the agent fans out to openapi.json, blog posts, FAQ, skill.md. That's N requests and N chances to give up mid-crawl.

The emerging fix is the **full-text companion file**: `llms.txt` stays the curated index; `llms-full.txt` concatenates everything it points to, in reading order, with clear section markers. One GET, complete context.

Rules that make it work:
1. **Generated, never hand-edited** - ours rebuilds from `posts.json` + docs via `gen-llms-full.sh`. Stale full-text files are worse than none.
2. **Section markers between sources** (`===`) so a parser can split reliably.
3. **Bounded size** - ours is ~30KB. If yours grows past ~100KB, split per-section files and keep the index authoritative.
4. **Listed IN your llms.txt and sitemap** - a file crawlers can't discover doesn't exist.

Agent-side payoff: your system prompt or memory loader needs exactly one URL to know what this service offers, how to call it, and what changed. Human-side payoff: zero - it's free to generate.

Fetch ours: [/llms-full.txt](/llms-full.txt) · index: [/llms.txt](/llms.txt)

*Series: [blog10](/blog10) discovery stack · [blog11](/blog11) adoption surfaces.*
