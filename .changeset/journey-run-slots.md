---
'lowdefy': minor
'@lowdefy/node-utils': minor
---

feat(cli): Journey runs wait for a run slot and exit 75 when the machine stays busy

`lowdefy test`, `lowdefy journeys harden` and `lowdefy journeys variants` now take two slots before they start or attach to a dev server, and hold them until the last journey ends: one run per worktree, and at most two journey runs on the machine (one while memory pressure is critical; set `LOWDEFY_JOURNEY_RUN_SLOTS` to change the count). A run that has to wait prints which runs hold the slots every 30 seconds. After 20 minutes of waiting it prints "The machine is busy running other journeys. Try again later; do not start your own dev server." and exits with code 75, having started nothing.

`acquireMachineSlot` takes three new optional options: `describe` (extra fields for the slot file), `onWait` with `onWaitIntervalMs` (called while waiting, with the live holders), and its timeout error now carries `code: 'MACHINE_SLOT_TIMEOUT'`, the slot `name` and the `limit`.
