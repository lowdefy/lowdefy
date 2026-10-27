---
'@lowdefy/client-native': patch
'@lowdefy/layout-native': patch
'@lowdefy/blocks-native': patch
---

fix(native): Read lengths, typed numbers and html labels in linear time

Five regular expressions in the native client took time that grew with the square of the input on long strings that do not match: a CSS length (`toPixels`, a block `size` or `flex` basis) and the text typed in a NumberInput, given a long run of digits; an option label or "supports html" text given a long run of `<`; and the app server url given a long run of `/`. A string of 100,000 such characters held the JavaScript thread for several seconds. Each now reads the same strings with a pattern that does not backtrack, so the results are unchanged. Text with an unclosed `<` before a tag now keeps that `<`: `<a<b>` shows as `<a`, where before the whole of it was dropped.
