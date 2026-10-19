---
'@lowdefy/server-dev': patch
---

fix(server-dev): A failed `expect.text` journey step reports the text it found, not a 1ms timeout

When a block's text never matched, the step's last poll ran with the few milliseconds left of its timeout, failed on its own latency, and its `Timeout 1ms exceeded ... waiting for locator('#bl-...')` replaced the text the earlier polls had read. The failure now reports that text, and says so when it matches except for case (the browser reports text as rendered, so a block styled with `text-transform: uppercase` reads as `LAPSED`).
