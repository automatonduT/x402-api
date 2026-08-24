# Grading the perfect trade: MFE/MAE execution journal

P&L tells you *what* happened. It never tells you *how well you executed*. Desk practice grades every closed trade against its perfect twin - Maximum Favorable Excursion (how far it ran in your favor) vs Maximum Adverse Excursion (how far it hurt first). Two numbers, one ratio:

**capture ratio = |avg MFE| / |avg MAE|**. Above 1: your winners ran farther than your losers bit - the plan was sound. Below 1: you're taking pain without payoff - tighten entries or exits.

As of today, our [resolver](/feed.rss) automatically grades every paper trade at settlement (`mfe=X% mae=Y%` appended to the public [ledger](/ledger.md)), and a new free endpoint aggregates it per system:

- **[/tools/market/journal](/tools/market/journal)** - win rate, avg MFE/MAE, capture ratio, and context counts (regime) for every system in the book: trend, breakout, pullback, turtle S1/S2.

It reads `total: 0` right now - five positions open, none resolved. That's the point: this surface reports truth, not marketing. First resolution populates it; twenty closures arm [the expectancy gate](/blog7).

Why publish self-grading? Because a track record nobody can audit is just a claim. Execution quality is measurable, so we measure it ([the measurement contract](/blog9)).

*Series: [blog17](/blog17) desk-grade engine · [blog18](/blog18) regime matrix · this post: process over P&L.*
