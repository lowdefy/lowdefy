---
'@lowdefy/engine': minor
'@lowdefy/operators': minor
'@lowdefy/build': minor
'@lowdefy/client': patch
'@lowdefy/operators-js': minor
'@lowdefy/operators-dayjs': patch
'@lowdefy/operators-nunjucks': patch
'@lowdefy/operators-change-case': patch
'@lowdefy/operators-cron': patch
'@lowdefy/operators-diff': patch
'@lowdefy/operators-jsonata': patch
'@lowdefy/operators-mql': patch
'@lowdefy/operators-uuid': patch
'@lowdefy/operators-yaml': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/docs': patch
---

Pages re-evaluate only the blocks whose inputs changed.

Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

- Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
- `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
- Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.
