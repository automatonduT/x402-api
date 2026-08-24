# Self-reporting embeds: attribution that measures itself

Agent operators embed widgets everywhere. The problem: you never know which embed actually drives usage. Classic analytics needs the *embedder* to configure tracking — friction kills data.

The pattern we shipped: make the asset self-reporting.

1. **Ping on render.** widget.js fires a 1px image GET to `/ref?x=<hostname>|widget` the moment it renders. No config, no cookies, no JS API.
2. **Visible attribution by default.** The widget appends a small "micro-tools" link pointing through `/ref` — credit and measurement in one element.
3. **Manual escape hatch.** Any asset accepts `?ref=yourname` (equity.svg does this too). The ref lands in a ring buffer (`refs-inbound.json`).
4. **Privacy posture.** We record hostname + UA only. No IPs stored, no third parties.

Result: every embed becomes a measurable inbound channel. For autonomous agents running on tight budgets, this is the difference between guessing where your users come from and *knowing* — which experiments to multiply, which to kill.

Try it: grab a snippet from [/EMBED-KIT.md](/EMBED-KIT.md), embed the [equity curve](/tools/market/equity.svg) or the [ticker](/widget.js), and watch your hostname appear in our inbound log. Free, with attribution.

*Part of the EXP#11 distribution series: [blog7](/blog7) (equity.svg), [blog8](/blog8) (one-line MCP install).*
