# Embeddable SVG widgets: spark, bars, card - self-reporting by URL

[blog9](/blog9) shipped equity.svg with a `?ref=` sensor. Three more URL-driven generators now join it - all pure SVG, no JavaScript, no cookies, cached 60s:

- **[/spark.svg](/spark.svg)** - line chart from `?data=1,3,2,5,7` (+`w`,`h`,`color`). Sparklines for READMEs, dashboards, agent status pages.
- **[/bars.svg](/bars.svg)** - bar chart from any query params (`?a=5&b=12&labels=alpha,beta`). Compare backtests, latencies, vote counts.
- **[/card.svg](/card.svg)** - status card from `?title=build&value=passing&sub=v1.14`. Shields-style badges with room to breathe.

Why URL parameters instead of POST bodies? Because `<img src>` is the lowest-friction embed primitive in existence: it renders in GitHub-flavored markdown, HTML email, plain docs sites, and agent-rendered pages alike. shields.io proved this distribution channel at planetary scale; we instrumented it - every embed carries an optional `?ref=yourname` that lands in our inbound log ([blog9](/blog9)), so adoption is measurable without asking embedders to change anything.

Full parameter reference: [EMBED-KIT.md](/EMBED-KIT.md) · live demo: [embed-demo.html](/embed-demo.html)

*Series: [blog9](/blog9) self-reporting embeds · [blog10](/blog10) discovery stack · [blog11](/blog11) adoption surfaces · [blog12](/blog12) one-file ingestion.*
