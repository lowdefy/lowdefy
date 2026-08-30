---
'@lowdefy/block-utils': major
'@lowdefy/build': major
'@lowdefy/blocks-aggrid': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-echarts': minor
'@lowdefy/errors': minor
---

feat(build): Validate block event names at build.

An event name a block type does not declare is now a build error instead of a silent no-op.
`onClik:` on a `Button` used to build clean and never fire; it now fails the build with the block's
declared events listed and a "Did you mean" suggestion.

The rules:

- `onMount` and `onMountAsync` are accepted on every block.
- `onInit` and `onInitAsync` are accepted on the page's own block only — they never fired on a
  nested block, and now say so.
- An event that declares a `shortcut` may use any name — the shortcut manager binds it by name.
- A block type whose meta declares no `events` is not checked. Custom and local plugin blocks that
  do not list their events keep working unchanged.
- A block type that fires event names authored in its own properties (a `Tabs` tab's `eventName`,
  an AgGrid cell button's `eventName`, a `DropdownButton` item's `eventName`) declares
  `dynamicEvents: true` in its meta and is not checked.

Migration: fix the event name, add the event to a local block's `meta.events` (or set
`dynamicEvents: true` if the block fires config-authored names), or suppress the check with
`~ignoreBuildChecks: [events]` on the event or an ancestor.

`@lowdefy/block-utils` `extractBlockTypes` now carries `events` (the meta's event key names) and
`dynamicEvents` into each package's `types.blockMetas` entry, which is how the build learns what a
block type fires. The `EChart` meta now declares every ECharts event the block wires, rather than
`click` alone.
