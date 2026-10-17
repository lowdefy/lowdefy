---
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey `fill` step sets a `ColorSelector`'s colour

A `fill` on a `ColorSelector` set nothing: the step typed into the block's first text input, and the colour picker shows none until its popup opens. A `fill` now opens the picker, types the hex colour (6 or 8 digits, such as `#1677ff`) into its hex input and closes it, so the block's value is that colour. A `fill` on a block with no text input or colour picker fails with a message naming the block type.
