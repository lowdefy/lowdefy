---
'lowdefy': minor
---

feat: `lowdefy journeys explore` writes a candidate journey for every finding, in a directory of its own run

Each explore run now writes its candidates to `tests/journeys/_candidates/explorer/<run>/`, with finding candidates under `findings/`, and never reads or rewrites another run's directory.

- Every finding gets one candidate per finding key, compiled from the first walk that hit it. The candidate names the walk's data set as `data:` and its data set user as `user:`, so a run of it starts on a fresh copy of the data the walk failed on. Its origin carries the finding's key, kind, message and source.
- A dead click's candidate ends on the click and then `expect: { effect: true }`, so it fails until the control does something.
- A role refused at open becomes a one-step journey, `expect: { visible: <pageId> }`, on the walk's page, data set and user.
