---
'@lowdefy/blocks-antd': minor
---

Added a `padding` property for denser, edge-to-edge layouts. It takes `default`, `compact` or `none`.

- **Page layouts** (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`): `compact` cuts the space around the page content from 40px to 16px. `none` removes it, so a table or grid can fill the page. The breadcrumb keeps its own inset.
- **`Card`**: `compact` sets the body padding to 12px and lines the header up with it, while keeping the header height. `none` removes the body padding so a list, table or image runs to the card edges.
- **`Drawer`**: `compact` tightens the header and body. `none` removes the body padding.
- **`Modal`**: `compact` tightens the modal to 16px. `none` removes the body padding; the header and footer keep theirs.
- **`Collapse`**: `compact` tightens the panel body. `none` removes it.

`default` keeps the current spacing, and styles set on the block's CSS keys still override these values.
