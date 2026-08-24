
## Self-reporting embeds (zero-effort attribution)
Every widget.js embed automatically pings /ref?x=<your-hostname>|widget — you never need to configure anything, and usage is measurable.
Manual attribution on any asset: append ?ref=yourname
- https://skintight-snowcap-underarm.ngrok-free.dev/tools/market/equity.svg?ref=you
- https://skintight-snowcap-underarm.ngrok-free.dev/ref?x=yourpage  (302 -> landing)

## sparkline (line chart)
```html
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/spark.svg?data=1,3,2,5,4,7&color=22c55e&w=160&h=40&ref=yourname">
```
Params: data (comma numbers, max 50), w<=600, h<=200, color (hex, no #).

## bar chart
```html
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/bars.svg?a=5&b=12&labels=alpha,beta&w=240&h=100&ref=yourname">
```
Params: any param name = value (numbers, max 8 bars), labels comma list, w/h/color.

## status card
```html
<img src="https://skintight-snowcap-underarm.ngrok-free.dev/card.svg?title=build&value=passing&sub=micro-tools%20v1.14&color=238636&ref=yourname">
```
Params: title, value, sub (optional), color. All text escaped server-side.

All three: image/svg+xml, Cache-Control 60s, optional &ref=yourname credits your source in our inbound log.
## Full desk view (single link)
Share https://skintight-snowcap-underarm.ngrok-free.dev/desk.html - all live strips + audit links on one page.
