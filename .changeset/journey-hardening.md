---
'lowdefy': minor
'@lowdefy/server-dev': minor
---

feat: Harden journeys with lints, config mutants and edge-case variants

`lowdefy test` can repeat journeys (`--repeat 3`) and lint them (`--lint`). `lowdefy journeys harden` breaks your config on purpose, one change at a time and only in the test's own browser, and reports each change no journey noticed with its source line. `lowdefy journeys variants` writes edge-case journeys (bad input, reload, double click).

- **`lowdefy test --lint [paths...]`** checks journeys without running them: no placeholders (L1), every action that ran an event followed by an assertion (L2), no fixed waits (L3), journeys that write declare `data:` (L4), and a final assertion (L6).
- **`lowdefy journeys harden`** runs each journey once, lists the mutants on what it exercised, runs each against the journeys that reached it, and writes `.lowdefy/test/mutation.json` with each journey's kills. `--list` estimates the run, `--mutant <id>` confirms one kill, `--max` and `--seed` sample. It carries its verdicts over config edits made while it runs.
- **`lowdefy journeys variants <file>`** writes `negative`, `interrupt` and `double-submit` candidates to `tests/journeys/_candidates/variants/` with a `variant: { of, kind, detail }` key, and replays each three times.
- **Journey results report the events that ran and the blocks shown** (`exercised.events`, `exercised.rendered`), measured from inside the journey's own browsers only.
