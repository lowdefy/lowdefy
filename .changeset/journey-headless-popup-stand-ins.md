---
'@lowdefy/journey-headless': minor
---

feat(journey-headless): Headless runs click modal buttons and dropdown and menu items by `control`

A headless journey now answers `{ blockId, control }` clicks and `open` on antd `Modal`, `ConfirmModal`, `DropdownButton`, `DropdownMenu` and `Menu`, firing each component's events in its order with its payloads, and `Modal` and `Drawer` fire their full open and close events (`afterOpenChange`, `afterClose`). A step on a block type with no headless stand-in, a submenu item or a horizontal `Menu` item marks the journey browser-only, naming the block and its type.
