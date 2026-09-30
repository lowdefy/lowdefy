---
'@lowdefy/api': minor
'@lowdefy/docs': minor
---

Implement the `:while` routine control. A routine using `:while` now runs its `:do` routine repeatedly while the condition holds, instead of failing at request time with "Unexpected control" for config that built cleanly.

The condition is re-evaluated before every iteration against the routine's current `state` and `steps`. Unlike `:for`, a `:while` loop does not index the step results of its body, so each iteration overwrites the previous one and `_step: my_step` reads the latest iteration's value. There is no iteration cap - a condition the body never falsifies loops forever, as it would in JavaScript.
