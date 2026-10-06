---
'lowdefy': minor
---

feat(cli): `lowdefy journeys explore --charter "<goal>"` steers a run with a one-sentence goal

A charter such as `"try edge input on the invoice form"` tells the explorer's model what to aim for, beside the pull request's text when there is one. At each step the model is asked which generated option best serves the charter, and afterwards how closely that step served it. Two stances work through the options walks already generate: edge input (the empty, long and invalid fill values) and error paths (cancel, delete and incomplete submits). The charter never chooses pages or users (`--page` and `--role` do), and it never decides findings: the same fixed checks decide, so a charter run reports the same kinds of finding as any other.

- **No pull request needed.** With `--charter` and neither `--pr` nor `--against`, the run builds only the working tree, with no base and no diff. It walks the `--page` pages, else the top production entry pages from `coverage.json`, else the home page, and every block on those pages is in scope, so every coverage candidate is kept.
- **A charter needs a model.** `--charter` without `AI_GATEWAY_API_KEY`, or with `--policy seeded`, is refused before anything is built, because the seeded policy never reads the charter.
- `report.json` records the charter (`charter: { goal }`), and the summary prints it.
