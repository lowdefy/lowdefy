---
'lowdefy': minor
---

`lowdefy test --journeys-directory <path>` reads journeys from another directory instead of `tests/journeys`. Journeys that write (sign-ups, organizations, invitations) and need their own database, mail sink and server can live there, where a plain `lowdefy test` and the `lowdefy_run_tests` agent tool never read them, and run only from a script that sets up what they need. A named directory that holds no journeys fails the run.
