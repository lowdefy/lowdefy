---
'@lowdefy/build': patch
'@lowdefy/errors': patch
---

fix(build): component and archetype expansion give every generated node a config key of its own

Previously the body of a runtime component was cloned with the keys of the component definition, so two instances of one component on a page reported the same config location, an `~ignoreBuildChecks` on one instance silently suppressed build checks on the other, and one key could name two structurally different operator sites. Errors and warnings raised inside an instance still point at the component body's file and line (an inlined prop points at the use site that supplied it), and slot fillers keep the keys they were authored with.
