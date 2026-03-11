---
'@lowdefy/e2e-utils': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-basic': patch
---

fix(e2e-utils): Escape dotted block IDs in e2e CSS selectors.

Block IDs containing dots (e.g., `form.field.name`) now work correctly in e2e test locators. Added `escapeId()` utility to `@lowdefy/e2e-utils` that escapes CSS special characters, and updated all block e2e helpers and test specs to use it.
