`lowdefy journeys explore` walks the pages a pull request changed, as each role, on a [journey data set](/journey-data-sets). It reports what broke, each finding proven by a [journey](/config-tests) that fails with it, and it turns the walks into candidate journeys. Use it before a pull request merges, to catch errors nobody wrote a journey for and to propose journeys for what the pull request added.

```bash
# From the app directory of a checkout at the pull request's head
lowdefy journeys explore --pr 2531

# Or: the changes since the merge base with a branch
lowdefy journeys explore --against origin/main

# Or: no pull request, steered by a charter
lowdefy journeys explore --charter "try edge input on the invoice form" --page invoice
```

The explorer is not a gate. It exits with code `0` when the run completes, with or without findings. It exits with `1` only when it cannot run.

## Scope

The explorer finds what changed by building the config twice in full: once at the base (the merge base of the pull request), once at the head (your working tree, uncommitted changes included). Both builds use the head's installed Lowdefy, so a version bump does not show up as a change. It strips the build's location markers before comparing, so moving a block down a file changes nothing.

A page is a target when:

- its own config changed, or it is new;
- one of its requests changed, was added or was removed;
- it calls an endpoint (directly, or through endpoints that call endpoints) whose config changed;
- a request or endpoint it reaches uses a connection whose config changed;
- it subscribes to a websocket source whose config changed.

A change to an **app-wide** artifact (app events, menus, global, app, config, i18n, theme, auth, dynamic policies or tenant targets) can affect any page. It adds the three pages most production sessions start on (from `.lowdefy/test/coverage.json`, see [Coverage](/config-tests#coverage)), or the home page.

Removed pages are reported, not walked. Changes the diff cannot see (plugin code, notification or agent artifacts) are listed as "changed but not compared". Pass `--page <pageId>` to walk a page anyway. `--scope-only` prints the scope and walks nothing.

The base is built with the plugins the head installs. A plugin whose version changed is listed: its type changes are not in the diff. If the base cannot be built (for example, it lists a plugin the head no longer installs), every page is a target and the run says why.

## Charters

A **charter** is a one-sentence goal that steers a run where there is no pull request to follow, or that adds a direction to one that has:

```bash
lowdefy journeys explore --charter "try edge input on the invoice form" --page invoice
lowdefy journeys explore --pr 2531 --charter "try error paths: cancel, delete, incomplete submits"
```

The charter goes to the model beside the pull request's text, never in place of it. At each step, the model is asked which option best serves the charter, and afterwards how closely that step served it. A charter can only steer through the options the walk already generates, so two stances work:

- **edge input**: prefer the generated edge values (empty, long, invalid and the like) when filling in a form;
- **error paths**: prefer cancel, delete and submitting incomplete forms.

The charter never chooses pages or users. Pages come from `--page` and users from `--role`. It never decides what counts as a finding either: the same fixed checks decide, and a charter run reports the same kinds of finding as any other run.

Without `--pr` or `--against`, a charter run builds only your working tree, with no base and no diff. It walks the `--page` pages, or else the three pages most production sessions start on (from `coverage.json`), or else the home page. Every block on those pages is in scope, so every coverage candidate is kept.

A charter needs a model. `--charter` without `AI_GATEWAY_API_KEY`, or with `--policy seeded`, is refused before anything is built, because the seeded policy never reads the charter. The charter is recorded in `report.json` and printed at the top of the summary.

## Bug bash

A bug bash runs several charters as **one** run. Write them to a YAML file, each with a goal and, optionally, the pages and data set users it walks:

```yaml
# charters.yaml
- goal: Try edge input on the invoice form.
  pages: [invoice]
- goal: Try error paths on tickets, cancel, delete and incomplete submits.
  pages: [tickets, ticket]
  roles: [member_max]
- goal: Try edge input on the contact forms.
```

```bash
lowdefy journeys explore --charters charters.yaml
lowdefy journeys explore --charters charters.yaml --pr 2531
```

A charter without `pages` walks the run's other targets: the pages the pull request changed, or `--page`, or else the entry pages. A charter without `roles` walks as `--role`, or else every role the page has. When every charter names its own pages, a changed page that none of them names is not walked: the summary lists it under "Not run" (`no charter walks it`), and `report.json` lists it in `notRun` with reason `no-charter`. `--page` is refused then, since no charter would walk its pages. An unknown page or data set user, or a charter with no goal, is refused before any walk, naming the charter. `--charters` cannot be combined with `--charter`, and needs a model just as `--charter` does.

Every charter's (page, role) targets share one set of breadth-first rounds and the one `--budget`: the first target of each charter is walked before any charter's second. The run holds one walk open at a time, so it stays within the dev server's limit of two open walks. Findings merge by key across charters, and each finding lists the charters whose walks hit it. Each finding is proven once, however many charters hit it.

`report.json` gains `charters`, each with its goal, pages, roles and number of walks. Its findings keep their order: proven first, then not proven by reason. The summary lists the charters, and under each finding the charters that hit it.

`lowdefy agent-setup` installs a `journeys-bug-bash` skill that writes 3 to 6 charters from your app's pages (and the diff, on a branch) to a file outside the repository, runs the one command, and reports the proven findings first. It runs unattended through to the report, never writes an expectation, and never runs two explore processes at once.

## Data and roles

Walks click Save and Delete, so each walk runs on a fresh copy of a data set:

- `--data <name>`, else `tests/data/default.yaml`, else the only data set in `tests/data/`. Several data sets and no `default.yaml` is an error.
- An app with a `MongoDBCollection` connection and no data set is refused. Pass `--live-data` to write to whatever the app's connections point at. The run prints those connections first.
- `--live-data` and `--allow-external` need `cli.agentTools.allowWriteRequests: true` in `lowdefy.yaml`, the opt-in every agent tool that writes needs.

```yaml
# lowdefy.yaml
cli:
  agentTools:
    allowWriteRequests: true
```

A data set redirects only MongoDB connections. A control whose events reach any other connection (an HTTP API, mail, an AI model) is not clicked, unless `--allow-external <connectionId>` names every connection it reaches. Controls that run an auth action (sign in, sign out, two-factor and the like) are never clicked, because a walk's caller has no auth session.

Each page is walked as each role. If `coverage.json` has production's role matrix, the explorer uses the role sets production shows on the page, most sessions first, each as the first data set user with exactly those roles. Otherwise it walks once per distinct role set among the data set's `users`. A data set with no users walks as the dev server's default user. `--role <name>` keeps only those data set users.

## Policies

At each step, a **policy** picks the next interaction from a generated list of what is on screen. Fill and select values are generated too: an empty value, a fixture value, an example, a long value and an invalid one. The model only picks; it never writes a value or decides a finding.

| `--policy` | What chooses                                                                                                                           | When                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `jev`      | `typesafe-ai/jev`, the AI Gateway's evaluation model                                                                                   | the default when `AI_GATEWAY_API_KEY` is set |
| `model`    | an AI Gateway language model, through structured output: `--model`, else `LOWDEFY_EXPLORER_MODEL`, else `google/gemini-2.5-flash-lite` | on request                                   |
| `seeded`   | no model: a deterministic choice for `--seed`                                                                                          | the default without a key                    |

Set `AI_GATEWAY_API_KEY` in your shell or the app's `.env`. With `jev`, the structured-output model stands by. If the Gateway refuses Jev, or Jev rejects a request as over its limits, the run switches to that model for the rest of the run, and says so in its progress and its report. Jev has no zero-data-retention endpoint. If your app needs one, use `--policy model`.

The model sees the pull request's title and description, the charter if there is one, the page, the role, the changed blocks and the labels on screen. A label that is not from your config, your data set's fixtures or a value the walk typed is sent as `<data>`, so no snapshot data leaves your machine.

`--max-cost` (default `$1.00`) stops the run once the model cost the Gateway reports passes it. A call that reports no cost is counted at an estimate (Jev at its published price, other models at a deliberately high rate), and the run warns that the cap is working from an estimate.

## Findings

Fixed checks, not the model, decide what broke when the page opens and after each step:

| Finding          | When                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `action-error`   | an event failed with an error that is not a validation failure                                           |
| `client-error`   | an uncaught browser error, or a client error report, caused by the walk                                  |
| `server-error`   | a server error caused by the walk                                                                        |
| `request-failed` | a 5xx from a request or endpoint that no server error explains                                           |
| `dead-click`     | a click that ran no event, changed nothing on the page, sent no request and did not navigate (a warning) |
| `role-refused`   | the page's auth admits the role, production shows that role on the page, but the walk was sent elsewhere |

Errors are attributed to the walk that caused them: an error in your own browser tab, open beside the run, is never a walk's finding, and walk errors never show up in your build status. A redirect your config intends is not a finding: if the pull request changed the page's auth, it is listed as "access changed in this PR". An Atlas Search stage, which the data set's in-memory database cannot run, is listed as "not runnable on this data set".

An error finding stops its walk. Every finding is then proven by a failing journey, as below.

## Proof

A finding is reported only once a journey written for it fails. When the walks are done, the explorer compiles each walk that found something into a candidate journey, one per finding, on the walk's data set (`data:`) and as its data set user. It then runs each candidate twice, one at a time, against the dev server the walks used, recording nothing. Each run starts on a fresh copy of the data set. The finding is **proven** when both runs fail with it:

- an app error (`action-error`, `client-error`, `server-error` or `request-failed`) fails with the same [app error](/config-tests#app-errors) at any step, or when the page opens;
- a dead click fails at `expect: { effect: true }`, the one assertion the explorer adds after the click: the control did nothing;
- a finding at open (a role refused, or an app error from the page's `onInit` or `onMount`) is proven by a one-step journey on the page, `expect: { visible: <pageId> }`: a role refusal fails at that step, an app error when the page opens.

These two expectations are the only steps the explorer writes, each by a fixed rule from the check that raised the finding. Whether a proven dead click should do something is still your call.

Every other finding is listed as **not proven**, with one reason, and its candidate is deleted. The walk log and screenshots stay in the run directory.

| Reason           | Why                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `not-reproduced` | the journey did not fail with the finding on both runs                                            |
| `environment`    | an Atlas Search stage the data set's in-memory database cannot run, in the walk or in a proof run |
| `no-candidate`   | no journey could be compiled for it, such as a dead click whose click left no record              |
| `live-writes`    | the run used `--live-data` or `--allow-external`                                                  |

A run with `--live-data` or `--allow-external` proves nothing, because a proof would replay writes on live connections. Its findings are all `live-writes`, and the summary says to rerun on a data set.

Proofs run after the walks, outside `--budget` and `--max-cost` (they make no model calls), so running out of budget never leaves a finding unproven. The summary gives their time on a line of its own.

If a walk's recording splits in two (a page load nobody's click caused, or five idle minutes), only the part with the finding is compiled. That part may lack the steps that set up the page, and the finding then comes back `not-reproduced`.

## Candidates

The walks are recorded by the dev server's recorder and compiled by the same compiler as `lowdefy journeys compile`. Apart from the two proof expectations above, the explorer never writes a step itself. Each run writes its candidates to a directory of its own, `tests/journeys/_candidates/explorer/<run>/`, with a `.generated.json` recording a hash of each file as written, and never touches another run's candidates. At the start of a run, a candidate directory older than 14 days is removed, unless a file in it was edited or added since its run wrote it: a candidate you changed is never deleted. The summary says how many were removed and how many were kept for edits.

- `findings/`: one journey per proven finding, the one that proved it. Its origin block names the finding's key, kind, message and source. It fails under `lowdefy test` until the bug is fixed. Then it is the regression test: once `lowdefy test --repeat 3 <path>` passes, move it into `tests/journeys/`.
- The run directory itself: coverage candidates, kept only when they interact with a block the pull request added or changed. On a data set with a snapshot, recorded `expect.state` lines that hold snapshot values are dropped.

`lowdefy test` does not run `_candidates/`. Check a candidate with `lowdefy test --lint <path>`, prove it with `lowdefy test --repeat 3 <path>`, and move it into `tests/journeys/` when it passes. See [Replaying candidates](/config-tests#replaying-candidates).

## Budget and report

Each (page, role) gets `--walks` walks (default 5) of up to `--steps` interactions (default 15), within a wall-clock `--budget` for the run (default `20m`). Walks run breadth-first: every target gets its first walk before any target gets a second. When the budget runs out, the step in progress finishes and its walk closes. The run then compiles and reports. Before it starts, the run prints its plan and a time estimate.

Each run keeps its files in `.lowdefy/explore/<run>/`: `scope.json`, `walks.jsonl` (every step, the options offered and the answer), `findings.json`, `report.json` and `screenshots/`. The summary gives the targets walked, seconds per step and per walk, model calls, tokens and cost, what did not run and why, the proven findings with their journeys, the findings not proven by reason, the proof time and the candidates. `report.json` lists the proven findings first (errors, then dead clicks, then role refusals), then the rest grouped by reason. `--json` prints `report.json` instead. Run directories older than 14 days are removed at the start of a run.

The explorer runs against the app's dev server. If one is running or starting, it waits for it to be ready; otherwise it starts a headless one. `--url` names a running dev server instead.

## With a coding agent

`lowdefy agent-setup` installs a `journeys-from-pr` skill. It makes a worktree for the pull request, starts its dev server, runs the explorer, then takes you through the proven findings, one at a time, and then the candidates. For a bug, it drafts a pull request comment, naming the journey that fails as the regression test, and posts it only once you approve the text. On a snapshot data set the comment carries no snapshot data. It never writes a step the compiler did not produce, and it commits nothing.
