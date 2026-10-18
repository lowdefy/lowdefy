---
'@lowdefy/build': minor
'@lowdefy/shell': minor
---

feat: Mobile pages carry the icon data of the icons they draw

Each built mobile or shared page now carries `_icons`, the icon data of the icons its blocks draw, resolved as web pages' icons are (semantic names, aliases and plugin sets such as `tabler:`), in the full build and in dev page builds. The shell adds a page's `_icons` to the icon map the native `Icon` renderer reads, so block icons draw on the phone. Web pages are unchanged.
