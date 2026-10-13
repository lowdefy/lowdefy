---
'lowdefy': minor
'@lowdefy/docs': patch
---

feat: `lowdefy agent-setup` installs a `journeys-autopilot` skill that builds and hardens an app's journeys on its own

Start it once (in Claude Code, `/loop /journeys-autopilot`) from a shell that holds your app's secrets, and leave it running. It works alone, one dev server and one test run at a time, in its own git worktree, so your checkout and dev server are untouched. On an app with no journeys it first writes a data set with fixtures and a test user for each role and maps every page by role. It keeps a progress list in `tests/autopilot.yaml` and each cycle writes the journeys that matter most next: refusals and permissions, then writes, then the most-used pages, then edge cases. A journey is kept only after three clean runs and must check a value only the fixtures hold. Flaky journeys are quarantined with their cause, journeys that expose app bugs are kept as findings, and nothing is deleted or weakened to pass. When everything is covered it moves on to hardening. It keeps one pull request of journeys open at a time, resumes it from any machine, and stops adding to it at about 20 journeys until you merge it. Once those journeys merge, it fixes an obvious local app bug in a separate small pull request. It never merges or touches production or shared databases. Each cycle stops at a clean point, so it can be interrupted any time.
