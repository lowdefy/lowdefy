---
'@lowdefy/helpers': patch
---

fix(helpers): the serializer keeps `~k` and the other build markers on an object that has a `Date` child

The replacer shallow-copied such objects before reading their non-enumerable markers, so every object with a `Date` property lost its config key on every parse and its errors could not be located.
