---
'@lowdefy/build': major
'@lowdefy/errors': minor
'@lowdefy/docs': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-loaders': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/plugin-aws': patch
---

feat(build): Validate literal block `properties` against the block's schema at build.

Every block's `properties` are now checked against the JSON Schema its plugin ships (the
`properties` key of the block's meta). A misspelt property (`titel`), a property the block does
not have (`hideActionLoading` on a Button), or a value of the wrong type (`min: '0'` on a
NumberInput) is now a build error that names the block, the property, and the nearest valid name:

```
Block "submit" of type "Button": unknown property "titel". Did you mean "title"?
Block "qty" of type "NumberInput": properties.min must be number. Received "0".
```

Only literal config is judged. An operator-valued node is never failed, whatever its depth, and an
array holding an operator element is not length-checked; `required` is not enforced because an
operator may supply the field; a `null` value means "not set". `properties.title` on a page's root
block stays valid for every block type — it is the browser tab title.

**Breaking:** an app whose config carries a typo, or a property a block does not declare, no longer
builds. There is no codemod: run `lowdefy build` and fix each property the error names. For a block
whose plugin schema is wrong or incomplete, `~ignoreBuildChecks: [block-properties]` on the block
turns the check off for that block and its descendants (new `block-properties` check slug in
`@lowdefy/errors`).

The sweep of the core block plugins and the docs app fixed the schema gaps it exposed: numeric
`Avatar.size` and `Spinner.size`, `Collapse.defaultActiveKey` arrays, `Layout.hasSider`,
`SkeletonInput.label`, `SkeletonButton.shape`, `ProgressBar.progress`, `PhoneNumberInput.showFlags`,
`ColorSelector.label`/`title`, `Sider`/`Menu` `theme: light | dark`, `TimelineList.pending` text,
`SegmentedSelector.size: middle`, selector option `value` of any type (options lists now use
`anyOf`, so an empty list is valid), AgGrid grid-option passthrough (`additionalProperties`), the
AgGrid `cellStyle` object and the input cell types `textInput`, `paragraphInput`, `selector`,
`switch`.
