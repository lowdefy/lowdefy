---
'@lowdefy/build': patch
---

perf(build): The build parses each YAML and JSON config file once and gives every `_ref` to it its own copy, instead of parsing the file again for every `_ref`. Build output is unchanged. `.njk` files and refs read through a resolver are still parsed for each ref.
