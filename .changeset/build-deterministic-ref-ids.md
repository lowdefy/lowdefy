---
'@lowdefy/build': patch
---

fix(build): Two builds of the same config write the same keyMap.json and refMap.json

A ref in a file whose root is itself a `_ref`, or in another ref's vars, took a counter id in the order refs finished loading, so the ids in `refMap.json` and the `~r` of their keys changed from build to build. These refs now take an id derived from their position in the config, and `refMap.json` is written in a fixed order. Error locations are unchanged.
