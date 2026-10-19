---
'@lowdefy/build': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-basic': patch
---

fix: The plugin schema build check no longer warns about config that works

- A page's `properties.title`, which sets the browser tab title, is no longer reported as an unknown property of the page's root block. A `title` on a nested block that does not support it still is.
- `Img` accepts a string `width` and `height` such as `100%`, which the browser reads as a percentage.
- `Card` accepts a CSS string for the `bodyPadding` and `bodyPaddingSM` theme tokens, such as `28px 32px`.
- `Button` accepts `middle` as a `size`, antd's name for the default size.
