---
'@lowdefy/helpers': patch
---

perf(helpers): Answer `type` checks on plain objects without the full class walk

`type.isObject`, `type.typeOf` and the other `type` checks now answer a plain object (prototype `Object.prototype` or `null`, with the plain constructor) straight away, instead of running nine `instanceof` checks, a constructor name and `Object.prototype.toString`. Every other value takes the full path, so every input gets the same answer as before. On a large app's build this cuts the time spent in these checks from about 6 s to about 1 s.
