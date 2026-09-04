---
'@lowdefy/build': patch
'@lowdefy/api': patch
---

A `{ _slot: name }` marker in a runtime component's body no longer emits a spurious schema warning (`must NOT have additional properties - "_slot"`): the app schema accepts the slot marker as a block-list element and reports a clear message when a marker carries extra keys or a non-string slot name. Calling an API endpoint without a payload, whether a `CallAPI` action with no `payload` or a REST body without the key, now validates against a declared `payloadSchema` as an empty object instead of failing with "must be object".
