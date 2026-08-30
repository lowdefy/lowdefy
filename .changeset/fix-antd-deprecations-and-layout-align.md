---
'@lowdefy/blocks-antd': patch
'@lowdefy/layout': patch
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

fix: Clear antd 6 deprecation warnings from the block console, and make `layout.align` work.

**antd deprecation warnings.** Four blocks passed props that antd 6.3.1 marks `@deprecated`, so
every dev console carried `[antd: <Component>] ...` noise that crowded out real errors. The
Lowdefy-facing property names are unchanged — `showArrow`, `destroyInactivePanel`, `mask` and
`maskClosable` are still the app's API; only what reaches antd changed:

- `PhoneNumberInput` now passes `popupMatchSelectWidth` instead of `dropdownMatchSelectWidth`.
- `Collapse` now passes `destroyOnHidden` instead of `destroyInactivePanel`.
- `Selector`, `MultipleSelector` and `PhoneNumberInput` no longer pass `showArrow`. antd shows the
  arrow by default, so `showArrow: false` now hides it by clearing the suffix icon.
- `Drawer` now passes antd's object mask form, `mask={{ closable: ... }}`, instead of the
  deprecated top-level `maskClosable`.

A new e2e spec, `e2e/tests/no-antd-deprecations.e2e.spec.js`, opens every page of the blocks-antd
e2e app and fails on any `[antd` console message.

**`layout.align` was silently dropped.** `layout.align` sets the vertical alignment of a block's
own content area — the v5 replacement for `layout.contentAlign`, and what the layout docs and the
`layout.align` → `layout.selfAlign` codemod (`packages/codemods/v5-0-0/16-rename-align-to-selfAlign.md`)
both describe. The runtime discarded it unless `layout.selfAlign` happened to be set alongside it,
so a correctly migrated `layout: { align: middle }` did nothing at all and logged a deprecation
warning on every render. `layout.align` now always reaches the content area, and the warning is
gone. Blocks that set `layout.align` and relied on it doing nothing will start aligning their
content.

`layout.contentAlign` is now renamed to `layout.align` by the build, alongside the other `content*`
layout keys, with the usual deprecation warning (an error in production builds). It was previously
the only `content*` key with no rename, so it was silently ignored at build and at runtime.
