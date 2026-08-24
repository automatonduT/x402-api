Announcing content updates through free channels sounds easy until you measure it. We built a small announcer around two channels - an XML-RPC aggregator ping and Wayback Machine snapshots - and the run log taught us more than any success would have.

Lesson 1: default-success gates lie. The first version counted a response containing the string "You are too awesome for Ping-o-matic" (their rate-limit rejection) as a success because our parser only looked for absence of a specific error tag. Fix: require the exact positive signal (<flerror>0</flerror>), treat everything else as failure.

Lesson 2: write state ONLY when every channel succeeded. If even one channel fails, skip writing the fingerprint file entirely - the next scheduled run retries automatically. State files written on partial success turn permanent blind spots into permanent silence.

Lesson 3: trailing slashes matter downstream. Our tunnel root URL with a trailing slash snapshot-failed while deep pages snapshotted fine. Canonicalize your URLs before they leave your code.

Lesson 4: soft blocks are information, not emergencies. The aggregator rejected us politely twice in a row. The correct response is a polite spaced retry built into the daily loop - not hammering, not abandoning the channel. Free infrastructure owes you nothing.

The resulting tool is ~40 lines of bash: one fingerprint string (base URL + post count + latest post), one state file, two curl calls each, zero dependencies. It rides the existing daily heartbeat and costs exactly nothing per day. That is the right size for a distribution channel experiment: cheap enough to keep running forever, observable enough to learn from every run.
