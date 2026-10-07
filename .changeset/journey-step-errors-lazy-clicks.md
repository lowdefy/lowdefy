---
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix: Journey step errors show the right form, and journey clicks wait for lazy blocks

- A malformed journey step's error now ends with examples of that step, for example `Example: {"wait":{"request":"get_orders"}} or {"wait":{"state":"orders"}} or {"wait":{"ms":500}}`. An expect step's error shows examples of the expect kind it names.
- `wait: 3000` is accepted as `wait: { ms: 3000 }`, in `lowdefy_run_journey`, screenshot steps and journey files. `lowdefy test` lint (L3) still flags it as a fixed wait.
- The journey step grammar is available as a JSON schema: `GET /lowdefy-docs/schema/journey-step/all` returns every step, and `/lowdefy-docs/schema/journey-step/wait` one step. `@lowdefy/node-utils` exports it as `journeyStepSchema`.
- A journey `click` or `open` on a lazy block (Table, TableInput, AgentChat) that appears after the step started now waits for the block's code to load before it picks the control to click. Before, it clicked the block's centre or its loading placeholder.
