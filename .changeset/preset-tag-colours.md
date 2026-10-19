---
'@lowdefy/block-utils': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/client': patch
---

Tag colours are fixed and readable.

- **Preset tag colours render as themselves.** purple, cyan, geekblue, gold, lime, magenta and volcano pointed at CSS variables antd doesn't define, so they fell back to blue, orange, red or green. `pink` is added.
- **Tag text is readable.** Tags (Table, TableLight, ag-grid tag and progress cells, HTML `data-tag`/`data-status`) use antd Tag's fill, border and text shade, with the text mixed toward the base text colour. Every preset, status name and custom colour reaches at least 4.5:1 contrast in light and dark themes; gold text on its tint went from 1.75:1 to 6.4:1. red, orange, yellow, green and blue now take their base colour from antd's palette, as antd's Tag does, so status dots and rule colours shift slightly.
- **An input-container's slots can render with their own loading state** (`content[slot](style, { loading })`). By default they still inherit the block's loading, so existing blocks are unchanged. The Table uses this so its toolbar and bulk-bar buttons stay usable while the page loads.
