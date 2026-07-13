---
'@lowdefy/build': patch
---

fix(build): Two-stage entry-vars resolution fixes cache poisoning.

Module entry vars/connections now resolve in two stages (prepare, then
demand-driven finalize), so resolution order can no longer bake wrong values
into the per-entry var cache. Includes the demand-driven entry-config
integration suite.
