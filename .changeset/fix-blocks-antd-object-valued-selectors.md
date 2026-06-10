---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Display object-valued selector options correctly.

Selectors whose value is an object (an option `value`, or a `data` row, that is an object rather than a scalar) now render the selected value again — both when an option is picked and when the value is pre-populated via `SetState` (e.g. an edit form), including when matched by `primaryKey`. Previously the value was stored correctly but no tag/value rendered.

Selection matching and option de-duplication now compare values by identity — projecting `primaryKey` when set, otherwise the whole value — and ignore build-time location markers, so an object value defined in config matches the same value arriving from state or a request. Scalar-valued selectors are unaffected.
