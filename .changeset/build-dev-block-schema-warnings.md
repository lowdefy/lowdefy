---
'@lowdefy/build': patch
---

The dev server now warns about an unknown block key, such as a misspelt `propertys`, and other block schema mismatches, as `lowdefy build` does. Each page's content is checked when the dev server builds the page. It is a warning, not an error, and `~ignoreBuildChecks: [schema]` silences it.
