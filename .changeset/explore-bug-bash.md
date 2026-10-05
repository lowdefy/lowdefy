---
'lowdefy': minor
---

feat(cli): `lowdefy journeys explore --charters <file>` runs a bug bash as one explore run

A charters file is a YAML list of charters, each `{ goal, pages?, roles? }`. The run walks them all as one run: every charter's (page, role) targets share the breadth-first rounds and the one `--budget`, one walk open at a time, so a bug bash stays within the dev server's limit of two open walks. Findings merge by key across charters, each one naming the charters whose walks hit it, and each is proven once by a failing journey.

- A charter without `pages` walks the run's other targets (the pages a pull request changed, `--page`, else the entry pages); one without `roles` walks as `--role`, else every role. An unknown page or data set user, or a missing goal, is refused before any walk, naming the charter. `--charters` needs a model, works with or without `--pr`/`--against`, and cannot be combined with `--charter`.
- `report.json` gains `charters: [{ goal, pages, roles, walks }]`, and each finding gains `charters`. The summary lists the charters, and under each finding the charters that hit it.
- `lowdefy agent-setup` installs a new `journeys-bug-bash` skill. It writes 3 to 6 charters from the app's pages (and the diff, on a branch) to a file outside the repository, runs the one command unattended, and reports proven findings first, each with the journey that fails with it as the regression test to keep once the bug is fixed.
