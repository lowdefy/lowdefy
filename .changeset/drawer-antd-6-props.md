---
'@lowdefy/blocks-antd': patch
---

The `Drawer` block (used by `PageHeaderMenu`'s mobile menu) no longer logs antd 6 deprecation warnings for `width`, `height` and `classNames.content` on every page load. It passes antd's `size` and `classNames.section` / `styles.section` internally; the block's own config properties and rendered output are unchanged.
