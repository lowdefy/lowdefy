---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/operators': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix: Data read into a Dynamic block's `:return` stays data.

- Without a dynamic blocks policy, every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, now fails resolution and the block renders its fallback. Data may still fill values inside written blocks, as in the documented `_array.map` pattern. To render stored block config, put the Dynamic block under a policy and return the content through a `ValidateDynamic` step.
- An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
- Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
- Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. A property the schema describes without a mark is no longer judged as a URL by its name; action params and undescribed keys still are.
