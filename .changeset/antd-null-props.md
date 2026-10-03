---
'@lowdefy/blocks-antd': patch
---

A block property that resolves to `null` now falls back to the antd default, the same as when it is not set. `_state`, `_get` and the other getter operators return `null` for a missing key, and antd applies a default only to an `undefined` prop, so a `null` used to reach antd as a real value. Fixed:

- Errors and hangs: QRCode `errorLevel`, Progress `percentPosition`, Flex `component`, Result `status` and Watermark `font` threw, and a Carousel `slidesToScroll` froze the page. Carousel now leaves every `null` setting out.
- Layout: `variant` on the text inputs, NumberInput, the date selectors, the selectors, AutoComplete and Card (the border disappeared), `listHeight` on the selectors and AutoComplete (the dropdown grew without a limit), Slider `min`, `max` and `step`, NumberInput `step`, `precision` and `mode`, Modal `width`, Drawer `placement`, Tooltip and Popover `placement`, Popover and ColorSelector `trigger` (the popup never opened), TreeMultipleSelector `maxCount` (nothing could be selected), and Progress `type`, `showInfo`, `strokeLinecap` and circle `size`.
- Smaller fallbacks: QRCode `size`, `status`, `bordered`, `bgColor` and `type`, Badge ribbon `placement`, Statistic `groupSeparator`, Descriptions `colon`, Calendar `mode`, Menu `mode`, Steps `status`, `percent` and `variant`, TimelineList `orientation` and `variant`, Alert `type` and `variant`, Divider `variant`, FloatButton `type`, `shape`, `htmlType`, `duration` and `visibilityHeight`, ColorSelector `placement` and `format`, and Watermark `rotate` and `zIndex`.
