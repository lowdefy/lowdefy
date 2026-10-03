---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
---

The journey grammar accepts `from: recorded | shape`; the runner refuses placeholder values.

`fill`, `select` and `expect.state` take an optional `from`. `from: recorded` marks a value observed in a recorded trace; the step runs as usual. `from: shape` marks a placeholder, `value: null`, that a trace could not hold (a value typed in production, or a password the dev recorder did not keep). The dev server's journey runner and `lowdefy test` refuse a journey holding one before a browser opens, naming the step: fill it from a data set or the journey's user, then remove `from`. A `fill` or `select` with `value: null` and no `from: shape` is now a grammar error.

The step grammar now lives in `@lowdefy/node-utils` and `lowdefy test` checks it before starting a dev server, so a malformed step is reported as an invalid journey file with its step number. `lowdefy test` also accepts the `open` step, which the runner already supported.
