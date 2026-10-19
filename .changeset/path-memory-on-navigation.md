---
'@lowdefy/engine': patch
---

The path memory is written when a page link is followed, before the router push, not each time a link is resolved or drawn, so a page full of links no longer leaves one entry per link for the session. `resolveTarget` no longer writes the memory; the new `rememberTarget({ lowdefy, target })` writes the entry for a resolved page target (a `url` target writes nothing), and `createLink` calls it when a link is followed. A link opened in a new tab writes nothing.
