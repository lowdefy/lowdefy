---
'@lowdefy/api': patch
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
---

fix: API routine steps now evaluate operators against the full routine frame.

- `ValidateSchema` step properties can read routine state. `_state` in a `ValidateSchema` step resolved to `null`.
- Connection properties can read the loop item. `_item` in a connection's properties inside a `:for` or `:parallel_for` loop resolved to `null`.
- `$` in `_state`, `_step`, `_payload` and `_item` paths inside a `:for` or `:parallel_for` loop now resolves to the current loop index, as it does for list blocks on the client. For example, `_step: fetch.$.id` reads the current iteration's `fetch` result.
- Operators that evaluate nested config, such as `_function`, now receive a parser bound to the calling frame. `_function` bodies no longer depend on `_function` forwarding each frame field, so a nested `__function` keeps routine state, items and loop indices.
