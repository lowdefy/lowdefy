---
'lowdefy': minor
---

feat(cli): The `journeys-from-dev` and `journeys-from-production` skills write journeys from session logs

The skills `lowdefy agent-setup` installs no longer compile candidates. `journeys-from-dev` asks which session the developer meant, reads its log with `lowdefy journeys session <id>` (or `lowdefy_journey_session`), decides what the developer was proving (a failed attempt and its fix are both worth a journey), writes the journeys with assertions on outcomes rather than on generated ids, and keeps only those `lowdefy test --repeat 3` passes. `journeys-from-production` reads production session logs, or the grouped flows from 100,000 rows on, and writes and proves journeys the same way, with typed values from data set fixtures.
