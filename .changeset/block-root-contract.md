---
'@lowdefy/block-utils': minor
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-captcha': patch
'@lowdefy/blocks-diff': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-files': patch
'@lowdefy/blocks-google-maps': patch
'@lowdefy/blocks-loaders': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/blocks-qr': patch
'@lowdefy/blocks-tiptap': patch
'@lowdefy/docs': patch
---

feat(blocks): every block renders its own root attributes

A `blockRootProps` helper in `@lowdefy/block-utils` returns the block's `id`, a matching `data-testid`, and the app author's `class:` and `style:` merged from both the `block` and `element` slots, and every block in every Lowdefy block package applies it to the element it owns outermost. A block is addressable as `#<blockId>` (and by test id) whether or not a layout wrapper is rendered around it, and `class:`/`style:` reach the block itself rather than the wrapper: the prerequisite for making the layout wrapper optional. Blocks that own no element of their own (`Icon`, `Throw`, `GoogleMapsScript`) and blocks whose root is another Lowdefy component are recorded with a reason in a repo-wide source scan that fails if a new block skips the contract. `withTheme` no longer crashes when a block is composed internally without properties. Plugin authors: apply `blockRootProps` to your block's root, and pass your own default classes and styles as its `className` and `style` arguments.
