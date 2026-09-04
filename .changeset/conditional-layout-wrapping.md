---
'@lowdefy/client': minor
'@lowdefy/layout': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/docs': patch
---

Layout wrappers are now only rendered where layout was asked for. A block gets its `div.lf-col` when its own `layout:` sets a block key (`span`, `offset`, `push`, `pull`, `order`, `flex`, `grow`, `shrink`, `size`, `selfAlign`, a breakpoint, or `disabled`) or when it sits in a slot that renders a row; a content slot gets its `div.lf-row` when the slot or the container's `layout:` sets an arrangement key, when the slot has its own `class:`/`style:`, when the container passes a content style into the slot, or when any block in it is laid out. Otherwise the block's own root element is the node in the page, carrying its `id`, `data-testid`, `class:` and `style:`: a `Title` with no layout is an `<h1>`, not three divs. The decision reads which layout keys are present rather than what they evaluate to, so an operator resolving to `null` never restructures the DOM, and skeletons follow the same rule as the block they stand in for. The `#bl-<blockId>` and `#ar-<blockId>-<slot>` ids now exist only where a wrapper does; target the block's own id. Golden DOM snapshots change; run `lowdefy snapshot --update` once and review the diff. Also fixes the block `class:`/`style:` being applied twice (wrapper and root), a skeleton's resolved class object reaching the DOM as `class="[object Object]"`, a skeleton losing the block id, and the client `Icon` now carrying the block root contract.
