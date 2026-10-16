---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix: A data-set journey fails a click only when an auth action actually runs

A data-set journey used to refuse every click on a block whose events held an auth action (`Login`, `Logout`, `SetActiveOrganization`, `UpdateSession` and the rest), even when the action was skipped or never reached. A "Create organisation" button that stops at its validation for an empty name, or at a duplicate-name refusal, could not be tested. The rail now acts while the click runs: the step fails, naming the block and the action, only if an auth-engine action executes. A click whose auth action is skipped (a failed `Validate`, a `skip:` condition that is true) passes. Refusals of clicks that reach connections a data set cannot run are unchanged.
