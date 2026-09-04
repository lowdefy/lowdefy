---
'@lowdefy/engine': minor
'@lowdefy/operators': minor
'@lowdefy/client': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): `lowdefy_measure_page` measures what one state change costs a page

How many blocks the engine re-evaluates, how many operator parses that is in total and per block expression (visible, properties, required, class, style, layout, loading, skeleton, slotsLayout, validate), how many nodes the parser copies, and the p50/p95/max milliseconds per update, together with the heaviest blocks and a one-line verdict. Pass journey steps to measure a real interaction such as typing into a form, or omit them to measure updates on the loaded page. The engine counters behind it are opt-in per session and only reachable from a dev build, so a production app allocates nothing and pays one boolean check per parse. This number decides whether operator evaluation is compiled away (P6) rather than tuned.
