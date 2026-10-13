/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// The journeys-autopilot skill: one agent, started once and left running, that
// builds an app's journeys from nothing and keeps hardening them. It keeps a
// committed ledger (tests/autopilot.yaml) of every page, role and write path,
// works the highest-value gaps each cycle in its own worktree, proves each
// journey before keeping it, and ships the work as reviewable pull requests.
// It spawns no agents, never deletes or weakens a journey, and never touches
// production or a shared database. It draws on the other journey skills inline.
function journeysAutopilot({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  const appDirectory = appPath === '' ? 'the repository root' : `\`${appPath}\``;
  return `---
name: journeys-autopilot
description: Use when the developer wants the app's journeys (tests) built and kept healthy without supervision, says 'just get this app tested', or the app has no journeys yet. Works alone in its own worktree, cycle after cycle, from a committed ledger; proves every journey before keeping it; ships pull requests; never deletes or weakens a journey.
---

# Journeys autopilot

A **journey** is a short YAML script (\`tests/journeys/\`) that opens a page as a given user, clicks and
types, and checks what the app shows. \`lowdefy test\` runs them against a throwaway database, so
nothing real is touched. You are the autopilot: one agent that builds the app's journeys from
nothing, then keeps finding what they miss. Each run is one **cycle** that moves the app forward and
stops at a clean point, so it can be interrupted at any time and run again. The app is in
${appDirectory}.

## Start it, stop it

Tell the developer this once, in your first message, in plain words: what journeys are, that you
will work in a separate worktree and branch (their checkout and dev server stay untouched), that
you open pull requests and never merge, and how to run you unattended:

- Claude Code: \`/loop /journeys-autopilot\` (self-paced: you pick the next wake-up, a few minutes
  after a cycle that found work, much longer after one that found none) or a background session
  running \`/journeys-autopilot\`.
- Stop: interrupt the session, or stop the loop. Every cycle ends with the ledger committed and
  servers stopped, so nothing needs cleaning up.

## Rules

- **One agent.** Spawn no sub-agents and fan out nothing. One server and one \`lowdefy test\` run at
  a time. Start a dev server (\`lowdefy_dev_start({ directory })\`) only to look at a page, and stop
  it (\`lowdefy_dev_stop\`) before the cycle ends; \`lowdefy test\` starts and stops its own. Never
  run \`lowdefy dev\`, choose a port or kill a process by port or name. Run only your own worktree's
  commands; never touch the developer's checkout or another worktree.
- **Data sets only.** Every journey names a data set (\`data:\`), so it runs on an in-memory
  database loaded from \`tests/data/\`. Never run anything against production, a staging database
  or any shared service. Never read \`.env\` or secrets, never copy rows from a real database, and
  never set \`allowWriteRequests\`. Do not run \`lowdefy journeys pull\`.
- **Never ask a question mid-run.** Decide, or record the blocker (see Blocked) and stop.
- **Never weaken or delete a journey** to make it pass or stay green, and never propose deleting
  one. A journey that exposes an app bug is a finding; a flaky one is quarantined with a reason.
- **Never merge, never push to the default branch.** Push only the autopilot branches.
- **Commit small and often**, with the repository's conventions (\`git log\` shows them).
- Never add \`wait: { ms }\`: wait on \`{ request }\` or \`{ state }\`. Lint L3 refuses it.

## The ledger: \`tests/autopilot.yaml\`

Committed in the app, outside \`tests/journeys/\` (which \`lowdefy test\` reads as journeys). It is the only
memory between cycles; keep it current at every commit.

\`\`\`yaml
data_set: autopilot
pr: null                      # url of the open journeys pull request, if any
blocked: null                 # why the last cycle stopped early, or null
last_cycle: { date: 2026-10-13, added: 6, findings: 1, quarantined: 0, phase: build }
items:
  - id: orders.admin.open     # <pageId>.<role>.<short path name>
    page: orders
    role: admin               # a data set user name, or public
    kind: view                # view | refusal | write | edge
    value: high               # high | medium | low
    state: covered            # todo | covered | quarantined | finding | skipped
    journey: tests/journeys/orders/admin-opens-orders.yaml
    note: ''                  # quarantine/skip reason, or the finding and the failing step
\`\`\`

States: \`todo\`; \`covered\` (journey in the suite, proven); \`quarantined\` (in
\`tests/journeys/_quarantine/\`, with the flake and its cause in \`note\`); \`finding\` (failing journey
in \`tests/journeys/_findings/\`, with the app bug in \`note\`); \`skipped\` (with why: an auth flow, a
click that reaches a non-MongoDB connection, a page needing a real third party). Folders starting with
\`_\` are not part of the suite, so a finding or flake never turns the suite red.

## A cycle

Budget: about 40 minutes or 8 new journeys, whichever first. Then wrap up (step 9).

### 1. Worktree and state

From the repository, \`git fetch\`, then use the worktree \`../<repo>-journeys-autopilot\` on branch
\`journeys-autopilot/main\`, making it if missing: \`git worktree add -B journeys-autopilot/main
../<repo>-journeys-autopilot origin/<default branch>\`. Work there from now on, with absolute
paths, and run the repository's install command there once (a fresh worktree has no
dependencies). If \`gh pr view journeys-autopilot/main\` says that pull request merged or closed,
reset the branch onto the fresh default branch before anything else. If the branch has
uncommitted files from an interrupted cycle, finish proving them (they sit in
\`tests/journeys/_candidates/\`) or leave them in \`_candidates/\` unproven; never lose a committed
journey.

### 2. Bootstrap (only when there is no \`tests/autopilot.yaml\`)

1. Run \`${cd}lowdefy test --help\` and \`${cd}lowdefy journeys --help\`. If they fail, you are blocked
   (see Traps for a stale \`.lowdefy/dev\`).
2. Run \`${cd}lowdefy data list\`. If a data set already has users and fixtures, extend it with
   \`extends: [<name>]\` rather than editing it. Otherwise write \`tests/data/autopilot.yaml\`:
   one \`users\` entry per role the app's pages allow, named by role (read each page's \`auth\` and the
   app's \`auth.roles\`), the organization or tenant they belong to, and \`fixtures\` for every
   \`MongoDBCollection\` connection the pages' requests read, with fields taken from the requests'
   filters, pipelines and the blocks that show them. Fixtures are made-up, recognisable values
   (\`Autopilot Widget Alpha\`), at least two rows wherever order or filtering matters, a second tenant when the
   app has tenants (for refusal journeys), and dates written as explicit values. Read
   [journey data sets](/journey-data-sets) for the file format; \`generate:\` adds volume.
3. Map the app: \`${cd}lowdefy journeys scope --json\` lists every page with its roles; read each
   page's requests, endpoints and event chains (\`lowdefy_get_page_config\`, \`lowdefy_app_map\`,
   \`lowdefy_find_config\`). Write one \`todo\` item for each page and role that can open it, one
   \`refusal\` item for each role that cannot, and one \`write\` item for each control that writes data
   (a request or endpoint that inserts, updates or deletes).
4. Prove the harness with one journey: the first page, as its first role, \`expect.text\` of a value only
   a fixture holds. Run \`${cd}lowdefy test --repeat 3 <file>\`. This is your first covered item.
5. Commit the data set, ledger and first journey. Push the branch and open the pull request
   (step 8).

### 3. Pick the work

Read the ledger. Take up to 8 \`todo\` items, in this order: **refusals and permissions** (a role
that must not reach a page or control, and the other tenant's rows); **writes** (create, edit, status
changes, deletes by the app); the **views** people use most (home, lists, the pages the menu leads to);
then **edge cases** (empty state, bad input, a reload mid-flow). Within a tier, take the page
that is the most-used first: the \`value: high\` items. When no \`todo\` items remain, go to step 7.

### 4. Write each journey

For each item, as its role: look at the page (\`lowdefy_screenshot_page({ pageId, user, directory })\`)
and read its config, then write one journey in \`tests/journeys/_candidates/<area>/<name>.yaml\`.
Follow the format in [config tests](/config-tests): \`name\` (at most 100 characters),
\`description\` (the goal), \`data\`, \`user\`, \`pathParams\` and \`urlQuery\` when the page needs them.

- **Assert a real fixture value**, never only that a block is visible or a page rendered: \`expect.text\`
  of a name, status or count only the fixtures hold, or \`expect.state\`. A page that renders empty
  must fail.
- A write ends by asserting the stored result: the new value shown, or \`expect.state\` after
  \`wait: { request }\`. A refusal asserts the landing page (\`expect.url\`) or \`expect.hidden\`
  paired with a presence check that proves the page loaded.
- Address blocks by \`blockId\`, wait on \`{ request }\` or \`{ state }\`, and prefer \`urlQuery\` /
  \`pathParams\` / state to typing into fiddly inputs (date pickers and autocompletes flake). Never
  assert an id the app generated.
- A control whose events reach a connection that is not a \`MongoDBCollection\`, or an auth action, fails
  on a data set: leave it out and mark the item \`skipped\` with the reason.

### 5. Prove before keeping

Run \`${cd}lowdefy test --lint tests/journeys/_candidates\` and fix errors, then
\`${cd}lowdefy test --repeat 3 <file>\` for each candidate, one run at a time.

- **PASS** (three in a row): \`git mv\` it to \`tests/journeys/<area>/\`, set the item \`covered\`.
- **FLAKY**: fix the cause (a missing \`wait: { request }\`, two matching targets, a date that
  depends on today) and run three more. After two fixes still flaky, move it to
  \`tests/journeys/_quarantine/\`, set \`quarantined\` with the cause in \`note\`.
- **FAIL**: read the failing step. Journeys stop at the first failed step, so it tells you where to
  look, not the whole story. If your journey is wrong (misspelt block, wrong expectation), fix it
  and run again. If the app is wrong, it is a **finding**: move the journey to
  \`tests/journeys/_findings/\`, set \`finding\` with the step, expected and actual in \`note\`.

Commit after each batch of kept journeys, with the ledger.

### 6. Findings

For each finding, decide:

- **Obvious and local** (a misspelt block id in a \`visible\` operator, a wrong request id, a missing
  \`required\`; fixed in a few lines in one place, no behaviour to decide): fix it in a **separate**
  small pull request. Commit your work first so the tree is clean, then in the same worktree
  \`git switch -c journeys-autopilot/fix-<slug> origin/<default branch>\`, make the fix, and bring the
  failing journey in with \`git checkout journeys-autopilot/main -- tests/journeys/_findings/<file>\`
  and \`git mv\` it into \`tests/journeys/<area>/\`, so the PR shows it turn green. Run
  \`lowdefy test --repeat 3 <file>\` before pushing, open a PR titled \`fix: ...\` that says what broke,
  where, and which journey proves it, then \`git switch journeys-autopilot/main\`. The item stays
  \`finding\`, with the fix PR url in \`note\`, until that PR merges; then set it \`covered\`.
- **Anything else**: leave it a \`finding\` and write it up in the journeys PR for a person: the
  goal, the journey file, the failing step, what it expected and found, and the source line.

### 7. Harden (when no \`todo\` items remain)

Follow the [journeys-harden skill](.claude/skills/journeys-harden/SKILL.md), unattended: replay
(\`${cd}lowdefy test --repeat 3\`) the whole suite; run \`${cd}lowdefy journeys harden --list\` and, in
budget, \`${cd}lowdefy journeys harden\` on a few pages at a time (\`--page <pageId>\`); for each
survivor add the assertion that would catch it, then confirm with \`harden --mutant <id>\` and
\`lowdefy test --repeat 3\`. Add edge cases with \`${cd}lowdefy journeys variants <file>\` and keep what
passes as the skill describes (granted roles join the original journey's \`user\` list, the rest
become their own journeys; a failing variant is a finding). Add each as a ledger item.
A survivor whose config is dead is a finding about the app. If the app already has production
analytics cached (\`${cd}lowdefy journeys coverage\` reads them), add \`todo\` items for the flows and
role sets it names that no journey covers. Re-check \`quarantined\` items: replay each three times, and
return one to the suite only when it passes cleanly. Never delete a journey.

### 8. Ship

Push \`journeys-autopilot/main\` and open one pull request to the default branch, or update the
open one: \`gh pr create\` / \`gh pr edit\`, and record its url in \`pr:\`. The body is plain language
for someone who has never heard of journeys: what is now covered (pages and roles), the findings
and fix PRs, the quarantines with reasons, what the next cycle will do, and how to run the suite
(\`${cd}lowdefy test\`). Add a changeset or release note only if the repository's convention asks for
one for test-only changes. When the PR holds about 20 journeys, branch the next cycles from it
(\`journeys-autopilot/<n>\`, base = the previous branch) rather than growing it further. With no
\`gh\` or no remote, commit to the branch and say so in the ledger.

### 9. Wrap up

1. Stop every server you started (\`lowdefy_dev_stop({ directory })\`).
2. Update \`last_cycle\` and \`blocked\` in the ledger; commit with \`git status\` clean.
3. Report in two or three lines: journeys added, findings, quarantines, PR url, what is next.
   (Under \`/loop\`, choose the next wake-up now: soon if \`todo\` items remain, else hours.)

## Blocked

If the environment is broken (install fails, the dev server will not start, secrets or a database the
app needs at build time are missing, \`gh\` is unauthenticated for the push), do not guess and do not ask.
Write \`blocked: <what failed, the command, the error line>\` in the ledger, commit it, say so in the pull
request (or, with no PR, in the report), stop servers and stop. The next cycle starts by retrying the
blocker once; if it is still there, it only restates it.

## Traps

- A stale \`.lowdefy/dev\` from an older Lowdefy version makes \`lowdefy test\` fail with ENOENT on
  \`build/routes.json\`. Reinstall it by starting the dev server once
  (\`lowdefy_dev_start({ directory, restart: true })\`), then stop it and rerun.
- A dev server already running in the same app folder is used by \`lowdefy test\`, and a stray one can
  hold the folder. Check \`lowdefy_dev_status\` before a run; stop only servers you started.
- A green run means only that nothing written down broke. Harden finds what no journey checks, such
  as sort order with a single fixture row. Seed at least two rows wherever order or a filter matters.
- A fixture with a fixed calendar date goes stale against a page that shows "this week" or "today".
  Open such a page with an explicit \`urlQuery\` date, or compare against the fixture's own dates.
- Never trust a page that merely loads: assert a fixture value, or a page that renders empty passes.
- Do not rewrite a journey to match what the app does today without being sure that is right; a
  disagreement between the goal and the page is the finding.
`;
}

export default journeysAutopilot;
