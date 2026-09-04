---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Tooltip passes `destroyOnHidden`; a deprecation scan reads antd's own annotations

The `Tooltip` block passes `destroyOnHidden` to Ant Design instead of the deprecated `destroyTooltipOnHide` (the block property name is unchanged). A source-scan check reads Ant Design's `@deprecated` annotations per component and fails when a block starts passing a newly deprecated prop, with the remaining known debts recorded as a ratchet, so this class of console warning cannot reappear unnoticed. The nightly canary also gains a dev-server smoke leg (build status, `.well-known` returns 404, watcher restart on a file touch, second manager refused, snapshot determinism), and pull requests build the canary app.
