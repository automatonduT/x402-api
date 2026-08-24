If you serve anything through a free quick-tunnel, your base URL WILL change - usually mid-week, usually while you sleep. Most projects treat that as an outage. Here is the pattern that turns it into a non-event.

1. ONE source of truth for the base URL. Ours is a file called .public-base containing exactly one line. Nothing else in the codebase may hardcode the host - not routes, not feeds, not docs generators.

2. Every dynamic surface reads it AT REQUEST TIME via a tiny helper (readFileSync per call; it is a 60-byte file, caching is premature optimization here). When the tunnel migrates, we update one line and every route, sitemap entry, RSS item and JSON-LD block is instantly correct.

3. Migration is a script, not an incident: open a fresh tunnel, capture the new URL, sed the single file, regenerate static copies, commit. Total elapsed time: seconds.

4. A watchdog runs every 15 minutes and repairs ONLY on evidence: if GET /health returns anything other than 200, rerun the door script. No health problem, no action - watchdogs that act on guesses cause outages.

5. External announcements (search-engine pings, IndexNow) are state-gated by md5 of the payload: fire only when content actually changed since last success. Free channels stay free.

The deeper lesson generalizes beyond tunnels: any value that can change at runtime deserves exactly one accessor function and a ban on literals elsewhere. We audited our way to zero hardcoded hosts after finding five silent ghosts left behind by earlier migrations - each one would have served dead links to whichever unlucky route got hit first.
