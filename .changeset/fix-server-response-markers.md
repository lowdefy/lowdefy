---
'@lowdefy/api': patch
'@lowdefy/helpers': patch
'@lowdefy/server-dev': patch
---

fix: Endpoint responses no longer carry build markers, and the dev run-endpoint tool reports a failed routine's own error.

- Endpoint and request responses built from config (a `:return` object, a `:set_state` value read back) no longer include `~k`, `~r` and `~l` keys or wrap arrays as `{ "~arr": [...] }`. A webhook endpoint now sends its `:return` value to the caller in exactly the shape the config gives it.
- The dev server's run-endpoint and run-request tools (`lowdefy_run_endpoint`, `lowdefy_run_request`) no longer answer with `TypeError: Cannot read properties of undefined (reading 'length')` when a routine fails or ends without `:return`. They return the routine's result, including its error and the error's config source.
- `serializer.serialize` accepts `skipMarkers`, as `serializeToString` already does.
