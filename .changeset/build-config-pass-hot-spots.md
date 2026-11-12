---
'@lowdefy/build': patch
'@lowdefy/errors': patch
---

perf(build): Config builds spend less time extracting `_js`, walking refs and writing the key map

Three costs a CPU profile of a large app's config build showed. Build output is unchanged.

- Extracting `_js` no longer copies every page, request, endpoint and connection through a JSON round trip to swap each `_js` source for its hash. The build walks the config and replaces only the `_js` operators, the nodes above them, and nodes that have no key yet. A `target: both` page is walked once instead of twice.
- The ref walker asks, for every node it visits, whether the node is a module entry's `vars` or `connections`. It now runs the two patterns only for paths under `modules`.
- `keyMap.json` is written with `JSON.stringify` instead of the serializer, whose replacer ran for every value of a million entries and had nothing to add. Entries that list ignored checks still go through the serializer, so the file is the same byte for byte. `encodeColumnarKeyMap` in `@lowdefy/errors` reads each key map entry once instead of twice and builds its error text only when it throws.
