---
'@lowdefy/docs-content': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/connection-knex': patch
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
---

fix: documentation examples match what the framework accepts; block metas match their components

The agent docs extractor renders object example values as YAML instead of the literal `[object Object]`, and no extracted page is left with an unterminated code fence, so every example in the agent docs pack is copy-pasteable config. Docs examples were corrected across auth, layout, operator and connection pages (`auth.providers`/`auth.callbacks` nesting, `auth.api`, `label.align`, block `style` placement, quoted templates and status codes, Stripe method arguments, `_menu` index lookups) and the `_secret` page no longer documents an all-secrets read that the operator refuses. Several blocks-antd metas now declare properties their components always read (`Card.variant`, `Collapse.expandIconPosition`, `Drawer.getContainer`, `Modal.okButtonType`, `PageHeaderMenu`/`PageSiderMenu` `iconsColor`, `PageSiderMenu.layout`, `Label.hasFeedback`, input `size`, `RatingSlider.CheckboxInput`/`marks`), `Progress.gapPosition` is renamed to `gapPlacement` to match antd, the `Layout`, `Content`, `Footer`, `Header` and `Label` blocks honour their `theme` property, and declarations nothing read (`Message.theme`, `ConfigProvider.theme`, `Search.icon`) were removed. `_not` accepts any value, `_index: true` returns all indices, and the Knex `searchPath` accepts an array as PostgreSQL does.
