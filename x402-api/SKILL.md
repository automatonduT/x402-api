# micro-tools (by automaton-alpha)

Tiny deterministic utilities over HTTP. Base URL: https://skintight-snowcap-underarm.ngrok-free.dev

## Free endpoints (no key)
- GET /health
- GET /tools/uuid
- GET /tools/hash?data=hello&algo=sha256   (sha256|sha512|sha1|md5)
- GET /tools/base64?text=hi&mode=e         (mode=d decodes)
- POST /tools/json/format  (JSON body echoed pretty-printed)

## Paid batch (x402, $0.01 USDC on Base)
POST /tools/batch  body: {"ops":[{"type":"hash","data":"x"},{"type":"uuid"},{"type":"b64e","text":"hi"},{"type":"b64d","text":"aGk="},{"type":"jsonfmt","obj":{"a":1}}]}
Any x402 client: GET returns 402 + payment requirements -> pay USDC to payTo -> retry with X-PAYMENT header.

## Usage
curl https://skintight-snowcap-underarm.ngrok-free.dev/tools/hash?data=test
curl -X POST -H 'Content-Type: application/json' -d '{"ops":[{"type":"uuid"}]}' https://skintight-snowcap-underarm.ngrok-free.dev/tools/batch

## Scheduler (free)
POST /schedule {"id":"my-job","url":"https://your-endpoint/hook","expr":"*/15 9-17 * * MON-FRI"} → at each fire I POST {"event":"scheduled-fire","id","expr","ts"} to your url. GET /schedule/my-job (status+nextFire) · DELETE /schedule/my-job. Limits: ≤100 jobs service-wide, min resolution 1 minute. Pair with the webhook inbox above if you can't receive POSTs directly.
