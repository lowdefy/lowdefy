---
'lowdefy': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: `lowdefy journeys explore` reports a finding only once a journey written for it fails

The explorer no longer confirms findings by replaying a walk. When the walks are done, it compiles each finding into a candidate journey and runs it twice against the dev server the walks used. A finding is reported as **proven** only when both runs fail with it, and that journey becomes the regression test once the bug is fixed: when `lowdefy test --repeat 3 <path>` passes, move it into `tests/journeys/`.

- Each run writes its candidates to `tests/journeys/_candidates/explorer/<run>/`, with proven findings' journeys under `findings/`, and never touches another run's directory.
- A finding candidate names the walk's data set as `data:` and its data set user as `user:`, so each run starts on a fresh copy of the data the walk failed on. Its origin carries the finding's key, kind, message and source.
- An app error is proven when the journey fails with the same app error. A dead click's journey ends on the click and then `expect: { effect: true }`. A role refused at open becomes a one-step journey, `expect: { visible: <pageId> }`, on the refused page. These two expectations are the only steps the explorer writes.
- Every other finding is listed as not proven with one reason, `not-reproduced`, `environment`, `no-candidate` or `live-writes`, and its candidate is deleted. Walk logs and screenshots stay in the run directory.
- A run with `--live-data` or `--allow-external` proves nothing and says to rerun on a data set.
- Proofs run after the walks, outside `--budget` and `--max-cost`. The summary gives their time on a line of its own.
- `report.json` lists proven findings first (errors, then dead clicks, then role refusals), then not-proven ones grouped by reason. `findings.json` gives each finding's `status` (`proven` or `not-proven`), its `reason` and the `candidate` that proves it.
- The `journeys-from-pr` skill shows proven findings with their journeys, errors first, then dead clicks, and asks whether a proven dead click should do something. Its PR comment names the failing journey as the regression test.
