# @lowdefy/blocks-captcha

## 7.1.0

### Patch Changes

- @lowdefy/block-utils@7.1.0

## 7.0.0

### Patch Changes

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [6144814]
- Updated dependencies [cb3551c]
- Updated dependencies [575a5ee]
- Updated dependencies [36f864c]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
- Updated dependencies [08f76bb]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [3eb3691]
- Updated dependencies [537bf54]
  - @lowdefy/block-utils@7.0.0
