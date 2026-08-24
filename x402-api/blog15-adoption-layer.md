# Machine-readable adoption: widgets.json catalog + oEmbed discovery

Two quiet additions close the loop between "widget exists" and "widget gets adopted":

**1. [/widgets.json](/widgets.json)** - a machine catalog of every embeddable widget (spark, bars, card, equity, heat) with parameter docs and ready-made example URLs. An agent reading our [llms.txt](/llms.txt) can go from discovery to a working `<img>` tag in one fetch, no human in the loop.

**2. [/oembed](/oembed?url=...)** - standard [oEmbed 1.0](https://oembed.com) discovery endpoint. Platforms that speak oEmbed (forums, CMS plugins, chat clients) can resolve any of our SVG URLs into `{type:"photo",url,width,height,provider_name}` automatically. Unknown URLs get a clean 404 - no open-redirect surface.

Both are free, cached, and part of the same self-reporting contract: every widget render accepts `?ref=yourname` ([blog9](/blog9)), so adoption stays measurable.

Distribution stack so far: [blog10](/blog10) discovery surfaces -> [blog11](/blog11) adoption pages -> [blog12](/blog12) one-file ingestion -> [blog13](/blog13) static SVG generators -> [blog14](/blog14) live heatmap -> this post: platform-native integration.
