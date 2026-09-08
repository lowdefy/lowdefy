---
'@lowdefy/build': patch
---

fix(build): Collect Tailwind page content before `_js` extraction.

Tailwind class candidates were collected from the page tree after `_js` operator source
had been replaced by hashed function refs, so utilities used only inside `_js` strings
(e.g. an `Html` block building markup with `properties.html._js`) never reached the
Tailwind scanner and were missing from the compiled CSS. Both the full build and the
JIT dev build now collect page content while `_js` source is still present, so classes
embedded in `_js` code generate CSS like any other page content.
