---
'@lowdefy/blocks-antd': major
---

Rename and remove several block properties to match antd v6 API.

| Block        | Old property            | New property                                 |
| ------------ | ----------------------- | -------------------------------------------- |
| Modal        | `visible`               | `open`                                       |
| Tooltip      | `defaultVisible`        | `defaultOpen`                                |
| Tooltip      | event `onVisibleChange` | event `onOpenChange`                         |
| Progress     | `gapPosition`           | `gapPlacement`                               |
| Carousel     | `dotPosition`           | `dotPlacement`                               |
| Collapse     | `expandIconPosition`    | `expandIconPlacement`                        |
| Notification | `message`               | `title`                                      |
| Progress     | `success` (number)      | `success: { percent, strokeColor }` (object) |
| Breadcrumb   | children API            | `items` array API                            |
