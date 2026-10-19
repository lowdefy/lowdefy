---
'lowdefy': minor
'@lowdefy/docs': patch
---

`lowdefy mcp` adds `lowdefy_run_tests`: it runs the app's journeys (`tests/journeys/*.yaml`, the same selection and runner as `lowdefy test`, with an optional name `filter`) against the app's dev server, starting it if needed, and returns a summary plus one result per journey — passed, or the failing step with what was expected and what happened. Agents can prove a change did not break anything without a shell, and turn the steps they verified with `lowdefy_run_journey` into regression tests.
