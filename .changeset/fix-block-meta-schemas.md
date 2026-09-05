---
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-loaders': patch
---

fix: Block meta now declares the events and properties the components already support.

The `EChart` block declares all 35 ECharts events it wires through, not just `onClick`, so they are valid config and appear on the docs page. `AgGrid`, `Tabs` and `DropdownButton` mark themselves as firing event names authored in their own properties.

Several property schemas were narrower than the components that read them and are widened to match: numeric `Avatar` and `Spinner` sizes, `Collapse` `defaultActiveKey` arrays, `Layout` `hasSider`, `SkeletonInput` `label`, `SkeletonButton` `shape`, `ProgressBar` `progress`, `PhoneNumberInput` `showFlags`, `ColorSelector` `label` and `title`, `Sider` and `Menu` theme strings, `TimelineList` pending text, `SegmentedSelector` middle size, selector option values of any type, and the AgGrid grid-option passthrough and cell types.
