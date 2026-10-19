---
'@lowdefy/build': patch
---

fix(build): Module var properties that are never set stay out of the var object instead of becoming `null`

A module var declared with `properties` used to fill every declared property the app did not set, and that had no default, with `null`. Blocks that pass such an object straight through as props then handed `null` to the component library, which applies its own defaults only to `undefined` (for example a layout sider received `collapsedWidth: null`). Those properties are now left out of the object. A property the app sets to `null` explicitly, with no default, still reads as `null`, and `_module.var` on a single unset property still returns `null`.
