---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Export the e2e helpers of ColorSelector, ConfigProvider, Flex, FloatButton, Masonry, MasonryList, PageSidebarLayout, QRCode, SegmentedSelector, Splitter, Tour and Watermark

These blocks had e2e helpers that `@lowdefy/blocks-antd/e2e` did not export, so
`ldf.block(...)` on them failed with "does not have e2e helpers".
