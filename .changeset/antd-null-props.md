---
'@lowdefy/blocks-antd': patch
---

A block property that resolves to `null` now falls back to the antd default, the same as when it is not set. `_state`, `_get` and the other getter operators return `null` for a missing key, and antd applies a default only to an `undefined` prop, so a `null` used to reach antd as a real value. Fixed:

- Errors and hangs: QRCode `errorLevel`, Flex `component`, Result `status`, Watermark `font` and DropdownMenu `placement` threw, and a Carousel `slidesToScroll` froze the page. Carousel now leaves every `null` setting out.
- Layout: `variant` on the text inputs, NumberInput, the date selectors, the selectors, AutoComplete and Card (the border disappeared), Slider `min`, `max` and `step`, NumberInput `step`, `precision` and `mode`, Modal `width`, Drawer `placement`, Tooltip and Popover `placement`, Popover and ColorSelector `trigger` (the popup never opened), and Progress `type`, `showInfo`, `strokeLinecap` and circle `size`.
- Smaller fallbacks: QRCode `size`, `status`, `bordered`, `bgColor` and `type`, Statistic `groupSeparator`, Descriptions `colon`, Calendar `mode`, Menu `mode`, Steps `status`, `percent` and `variant`, Alert `type`, FloatButton `type`, `shape` and `htmlType`, ColorSelector `placement` and `format`, and Watermark `rotate` and `zIndex`.
