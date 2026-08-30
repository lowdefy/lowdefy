---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/server': minor
'@lowdefy/server-e2e': patch
'@lowdefy/operators-js': patch
'@lowdefy/errors': patch
'@lowdefy/docs': patch
---

feat: `_js` can reference an exported function in a real JavaScript file.

The object form of `_js` accepts a module reference in `fn` — `./lib/rows.js#buildRows` or
`./lib/rows.js#default` — naming an export in a `.js` file next to your config. The file is a
normal ES module: it can import shared helpers, be unit-tested, linted and navigated by your
editor. The exported function is called exactly like an inline body, with the same client or
server prototype (`{ args, state, request, ... }`).

```yaml
rows:
  _js:
    fn: ./lib/answer-detail.js#buildRows
    args: { docs: { _request: get_docs } }
```

The path resolves relative to the **config file that contains the `_js` node** (JS-toolchain
semantics — unlike `_ref`, which resolves from the config root). The build checks that the file
exists, parses, and has the named export (`js-modules` check slug), and reports the exports it
found with a "Did you mean" hint. In `lowdefy dev` the module is imported in place, so an edit hot-
reloads in the browser and restarts the dev server when a server-side module changes. `lowdefy
build` copies referenced modules into the server directory so the built server runs without the
config directory. Tailwind class strings inside a module are not scanned.
