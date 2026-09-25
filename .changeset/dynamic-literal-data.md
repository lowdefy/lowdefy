---
'@lowdefy/api': patch
'@lowdefy/docs': patch
'@lowdefy/operators': patch
---

Data returned into a Dynamic block's content is literal. While the endpoint a Dynamic block calls evaluates its `:return`, no operator may return a value containing operators, apart from operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`). Content that breaks the rule fails resolution and the block renders its fallback, with an error naming the operator and the path in its result.

Write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` now fail: build them inside `:return` with `_array.map`/`_array.concat`, and share block config with `_ref`. `unescapeOperators` now unescapes only operator keys, so data keys such as `__typename` pass through unchanged.
