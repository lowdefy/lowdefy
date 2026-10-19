---
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/engine': patch
'@lowdefy/errors': patch
---

fix(build): Check that CallMethod actions target a block on the page

A CallMethod whose `blockId` did not exist on the page failed at runtime with `Cannot read properties of undefined (reading 'methods')`. The build now warns when a static CallMethod `blockId` names no block on the page (an error in production builds), pointing at the action's config location. A concrete list row such as `list.0.input` matches the configured `list.$.input` block, and pages with Dynamic blocks are not checked because their blocks are only known at runtime. The check can be suppressed with `~ignoreBuildChecks: [callmethod-refs]`. At runtime, a `blockId` produced by an operator that names no block now fails with `block "<id>" does not exist on this page`. Fixes #1176.
