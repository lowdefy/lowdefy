---
'@lowdefy/blocks-antd': patch
'@lowdefy/docs': patch
---

fix: Clear antd 6 deprecation warnings from the block console.

Four blocks passed props that antd 6.3.1 marks `@deprecated`, so every dev console carried
`[antd: <Component>] ...` noise that crowded out real errors. The Lowdefy-facing property names
are unchanged — `showArrow`, `destroyInactivePanel`, `mask` and `maskClosable` are still the
app's API; only what reaches antd changed:

- `PhoneNumberInput` now passes `popupMatchSelectWidth` instead of `dropdownMatchSelectWidth`.
- `Collapse` now passes `destroyOnHidden` instead of `destroyInactivePanel`.
- `Selector`, `MultipleSelector` and `PhoneNumberInput` no longer pass `showArrow`. antd shows the
  arrow by default, so `showArrow: false` now hides it by clearing the suffix icon.
- `Drawer` now passes antd's object mask form, `mask={{ closable: ... }}`, instead of the
  deprecated top-level `maskClosable`.

A new e2e spec, `e2e/tests/no-antd-deprecations.e2e.spec.js`, opens every page of the blocks-antd
e2e app and fails on any `[antd` console message.
