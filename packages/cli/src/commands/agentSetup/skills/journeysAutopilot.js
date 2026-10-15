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
- Secrets: start you from a shell that holds the app's secrets, as exported variables or through a
  wrapper such as \`infisical run -- claude\`. Your worktree has no \`.env\`; you never read, copy or
  link \`.env\` and never invent a value, so a variable the app needs and your environment lacks
  stops the cycle as Blocked, naming it.
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
  or any shared service. Never read, copy or link \`.env\`, never invent a secret's value, never copy
  rows from a real database, and never set \`allowWriteRequests\`. Do not run
  \`lowdefy journeys pull\`.
- **Secrets come from your environment only.** \`lowdefy test\` passes your process environment to
  its server, and data set journeys swap every MongoDB connection for the in-memory database, so the
  app needs little more than its auth settings. \`_secret: NAME\` reads the variable
  \`LOWDEFY_SECRET_NAME\`. The auth secret and the auth database's address must be set even though
  data set journeys never reach the auth engine. A missing one shows as \`lowdefy test\` failing
  after two minutes with "Development server was not ready", after server lines that name the
  setting (\`Auth "secret" did not resolve\`, \`requires "uri"\`): Blocked, naming the variable.
  Run every command with \`LOWDEFY_DEV_USER\` unset
  (\`env -u LOWDEFY_DEV_USER <command>\`): a dev mock user refuses every data set journey.
- **Never ask a question mid-run.** Decide, or record the blocker (see Blocked) and stop.
- **Never weaken or delete a journey** to make it pass or stay green, and never propose deleting
  one. A journey that exposes an app bug is a finding; a flaky one is quarantined with a reason.
- **Never merge, never push to the default branch.** Push only \`journeys-autopilot/main\` and fix
  branches (\`journeys-autopilot/fix-<slug>\`). Never force a push, except the one case step 1 allows.
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
    role: admin               # a data set user name
    kind: view                # view | refusal | write | edge
    value: high               # high | medium | low
    state: covered            # todo | covered | quarantined | finding | skipped
    journey: tests/journeys/orders/admin-opens-orders.yaml
    note: ''                  # quarantine/skip reason, or the finding and the failing step
\`\`\`

States: \`todo\`; \`covered\` (journey in the suite, proven); \`quarantined\` (in
\`tests/journeys/_quarantine/\`, with the flake and its cause in \`note\`); \`finding\` (failing journey
in \`tests/journeys/_findings/\`, with the app bug in \`note\`); \`skipped\` (with why: an auth flow, a
click that reaches a non-MongoDB connection, a page needing a real third party, a signed-out
visitor). Folders starting with
\`_\` are not part of the suite, so a finding or flake never turns the suite red.

## A cycle

Budget: about 40 minutes or 8 new journeys, whichever first. Then wrap up (step 9).

### 1. Worktree and state

One branch, \`journeys-autopilot/main\`, holds the ledger and at most one open journeys pull request.
From the repository, \`git fetch origin --prune\`, then use the worktree
\`../<repo>-journeys-autopilot\` on that branch. Work there from now on, with absolute paths, and run
the repository's install command there once (a fresh worktree has no dependencies).

- **Worktree missing, \`origin/journeys-autopilot/main\` exists**: track it, so a run on another
  machine or a teammate's run picks up the pushed ledger: \`git worktree add --track -b
  journeys-autopilot/main ../<repo>-journeys-autopilot origin/journeys-autopilot/main\` (or, when
  the local branch exists, \`git worktree add ../<repo>-journeys-autopilot journeys-autopilot/main\`).
- **Neither exists**: \`git worktree add --no-track -b journeys-autopilot/main
  ../<repo>-journeys-autopilot origin/<default branch>\` (\`--no-track\`, so the branch never tracks
  the default branch). Only then is the branch made from the default branch.
- When \`origin/journeys-autopilot/main\` exists, fast-forward to it:
  \`git merge --ff-only origin/journeys-autopilot/main\`. If that is not a fast-forward, another
  runner moved the branch: Blocked.

Never \`git worktree add -B\` and never reset over an existing branch. The pull request's state
decides the rest: read it with \`gh pr view <the ledger's pr: url> --json state\`. Without \`gh\` or a
GitHub remote, read "merged" from git: the branch tip (the remote one, or the local one when the
remote branch is gone) is merged when it differs from \`origin/<default branch>\` and
\`git merge-base --is-ancestor <tip> origin/<default branch>\` succeeds. Git cannot see a squash
merge, so without \`gh\` only a merge commit or a rebase reads as merged.

- **Open, or none yet**: carry on.
- **Merged**: start the branch afresh from the default branch, which now holds the ledger. This is
  the one time the branch moves: \`git switch --no-track -C journeys-autopilot/main
  origin/<default branch>\`, set \`pr: null\` (commit only if that changed the ledger) and push at
  once (\`git push -u origin journeys-autopilot/main\`), so the next cycle finds the fresh branch on
  the remote. Then handle findings (step 6): their fixes may now go ahead.
  After a squash merge the fresh branch is not a fast-forward of the old remote tip, so this push may
  replace that tip, and only that tip, once you have confirmed it merged: \`git push
  --force-with-lease=journeys-autopilot/main:<old tip> origin journeys-autopilot/main\`.
- **Closed unmerged**: Blocked. Never reset or re-bootstrap; a person reopens it, or deletes the
  branch to start over.
- **A rejected push** (any other): another runner moved the branch. Blocked, never forced.

If the branch has uncommitted files from an interrupted cycle, finish proving them (they sit in
\`tests/journeys/_candidates/\`) or leave them in \`_candidates/\` unproven; never lose a committed
journey.

### 2. Bootstrap (only when there is no \`tests/autopilot.yaml\`)

1. Run \`${cd}lowdefy test --help\` and \`${cd}lowdefy journeys --help\`. If they fail, you are blocked
   (see Traps for a stale \`.lowdefy/dev\`).
2. Run \`${cd}lowdefy data list\`. Write \`tests/data/autopilot.yaml\`. If a data set already has
   users and fixtures, it starts \`extends: [<name>]\` and adds only what that set lacks; never edit
   the existing file. Otherwise it holds
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
   (a request or endpoint that inserts, updates or deletes). A signed-out visitor is not a data set
   user: its items (a protected page's bounce, a public page opened signed out) are \`skipped\` with
   the reason "signed-out runs stay on the auth harness" (\`user: none\` on a data set is refused
   while auth is configured, because signing in would write to the real auth database).
4. **Journeys already in the suite** (the app has journeys but no ledger): they are the developer's.
   Replay them once with \`${cd}lowdefy test --repeat 3\` (the whole suite). Read each one's
   \`pageId\`, \`user\` and steps, and set every item it proves (each user in a \`user\` list, the
   page it opens, the write it asserts) \`covered\` with its file and \`note: developer's journey\`.
   Never rewrite, move, rename or duplicate one, and never write a second journey for an item one
   already covers. A failing or flaky one stays where it is: set its item \`finding\` or
   \`quarantined\` with the reason, and name it in the pull request. These items count as your
   first covered ones.
5. Prove the harness with one journey of your own: the first \`todo\` page and role, as that role,
   \`expect.text\` of a value only a fixture holds. Run \`${cd}lowdefy test --repeat 3 <file>\`.
6. Commit the data set, ledger and first journey. Push the branch and open the pull request
   (step 8).

### 3. Pick the work

Read the ledger. If the open journeys pull request holds about 20 journeys, take no items: it is
at its cap (step 8): only re-check quarantines (the last part of step 7, which may return a
journey to the suite), nothing else, then ship. Otherwise take up to 8
\`todo\` items, in this order: **refusals and permissions** (a role that must not reach a page or
control, and the other tenant's rows, proved between signed-in data set users); **writes** (create, edit, status
changes, deletes by the app); the **views** people use most (home, lists, the pages the menu leads to);
then **edge cases** (empty state, bad input, a reload mid-flow). Within a tier, take the page
that is the most-used first: the \`value: high\` items. When no \`todo\` items remain, go to step 6
(a finding's fix may be ready), then step 7.

### 4. Write each journey

An item whose role is a signed-out visitor is \`skipped\` (step 2), never written. For each other
item, as its role: look at the page (\`lowdefy_screenshot_page({ pageId, user, data, directory })\`, with the data set
as \`data\`)
and read its config, then write one journey in \`tests/journeys/_candidates/<area>/<name>.yaml\`.
Follow the format in [config tests](/config-tests): \`name\` (at most 100 characters),
\`description\` (the goal), \`data\`, \`user\`, \`pathParams\` and \`urlQuery\` when the page needs them.

- **Assert a real fixture value**, never only that a block is visible or a page rendered: \`expect.text\`
  of a name, status or count only the fixtures hold, or \`expect.state\`. A page that renders empty
  must fail.
- A write ends by asserting the stored result: the new value shown, or \`expect.state\` after
  \`wait: { request }\`. A refusal asserts the landing page (\`expect.url\`) or \`expect.hidden\`
  paired with a presence check that proves the page loaded.
- After a click whose chain moves to another page (a \`Link\`), wait on a request of the page it
  lands on: the page you left is gone, so its requests are not found.
- Address blocks by \`blockId\`, wait on \`{ request }\` or \`{ state }\`, and prefer \`urlQuery\` /
  \`pathParams\` / state to typing into fiddly inputs (date pickers and autocompletes flake). Never
  assert an id the app generated.
- A control whose events reach a connection that is not a \`MongoDBCollection\` fails on a data set,
  and so does a click that runs an auth action (one that skips it, such as a form that stops at its
  validation, is fine): leave it out and mark the item \`skipped\` with the reason.

### 5. Prove before keeping

Run \`${cd}lowdefy test --lint tests/journeys/_candidates\` and fix errors, then
\`${cd}lowdefy test --repeat 3 <file>\` for each candidate, one run at a time.

- **PASS** (three in a row): move it with plain \`mv\` into \`tests/journeys/<area>/\` (candidates
  are untracked, so \`git mv\` fails), then \`git add\` it, and set the item \`covered\`.
- **FLAKY**: fix the cause (a missing \`wait: { request }\`, two matching targets, a date that
  depends on today) and run three more. After two fixes still flaky, move it to
  \`tests/journeys/_quarantine/\`, set \`quarantined\` with the cause in \`note\`.
- **FAIL**: read the failing step (the runner calls every 0/3 run a finding, even when the journey
  is what is wrong). Journeys stop at the first failed step, so it tells you where to
  look, not the whole story. If your journey is wrong (misspelt block, wrong expectation), fix it
  and run again. If the app is wrong, it is a **finding**: move the journey to
  \`tests/journeys/_findings/\`, set \`finding\` with the step, expected and actual in \`note\`.

Commit after each batch of kept journeys, with the ledger.

### 6. Findings

For each finding, decide:

- **Obvious and local** (a misspelt block id in a \`visible\` operator, a wrong request id, a missing
  \`required\`; fixed in a few lines in one place, no behaviour to decide): fix it in its own small
  pull request, but only once the journeys pull request that parked the journey in
  \`tests/journeys/_findings/\` has merged; the fix needs the data set and the journey that proves it.
  Until then the item stays \`finding\` with the note "fix waits for the journeys pull request".
  Once the journey is on the default branch (\`git cat-file -e
  origin/<default branch>:tests/journeys/_findings/<file>\` succeeds), commit your work so the tree
  is clean, then in the same worktree \`git switch -c journeys-autopilot/fix-<slug>
  origin/<default branch>\`, make the fix, and \`git mv tests/journeys/_findings/<file>
  tests/journeys/<area>/\`, so the pull request shows the journey turning green and leaves one copy.
  Before pushing, run \`${cd}lowdefy test --repeat 3 <file>\`, then the whole suite once
  (\`${cd}lowdefy test\`: a fix can break a journey that asserted the old behaviour). Open a pull
  request titled \`fix: ...\` that says what broke, where, and which journey proves it (with no \`gh\`, push the branch and put
  that title and body in the cycle report), then \`git switch journeys-autopilot/main\`. The item stays \`finding\`, with the fix pull request url (with no \`gh\`, the
  fix branch) in \`note\`, until that pull request merges; then set it \`covered\` with the journey's new path.
- **Anything else**: leave it a \`finding\` and write it up in the journeys pull request for a person:
  the goal, the journey file, the failing step, what it expected and found, and the source line.

### 7. Harden (when no \`todo\` items remain)

Follow the [journeys-harden skill](.claude/skills/journeys-harden/SKILL.md), unattended: replay
(\`${cd}lowdefy test --repeat 3\`) the whole suite; run \`${cd}lowdefy journeys harden --list\` and, in
budget, \`${cd}lowdefy journeys harden --workers 1\` on a few pages at a time (\`--page <pageId>\`),
one worker so only one journey runs at a time; for each
survivor add the assertion that would catch it, then confirm with \`harden --mutant <id>\` and
\`lowdefy test --repeat 3\`. The printed report has no ids: read them from
\`.lowdefy/test/mutation.json\` (each \`mutants\` entry has \`id\`, \`status\` and \`describe\`). Add edge cases with \`${cd}lowdefy journeys variants <file>\` and keep what
passes as the skill describes (granted roles join the original journey's \`user\` list, the rest
become their own journeys; a failing variant is a finding). A developer's journey is never edited,
whatever the variant file's comment says: its granted role becomes a journey of its own instead.
Variants run on the journey's own data set, so a journey whose data set has no user in another
organization gets no tenant variant; a tenant refusal on your data set covers that. Add each as a ledger item. A variant that proves only what a
covered journey already proves (same page, user and outcome) adds nothing: discard its candidate
file, which never joined the suite, and name it in the report, so \`_candidates/\` is left empty.
A survivor whose config is dead is a finding about the app. If the app already has production
analytics cached (\`${cd}lowdefy journeys coverage\` reads them), add \`todo\` items for the flows and
role sets it names that no journey covers. Re-check \`quarantined\` items: replay each three times, and
return one to the suite only when it passes cleanly. Never delete a journey.

### 8. Ship

Push \`journeys-autopilot/main\` (\`git push -u origin journeys-autopilot/main\`; a rejected push is
Blocked, never forced, apart from step 1's merged case) and open one pull request to the default
branch, or update the open one: \`gh pr create\` / \`gh pr edit\`, and record its url in \`pr:\`.
The body is plain language for someone who has never heard of journeys: what is now covered (pages
and roles), the findings and fix pull requests, the quarantines with reasons, what the next cycle
will do, and how to run the suite (\`${cd}lowdefy test\`). Add a changeset or release note only if
the repository's convention asks for one for test-only changes.

There is never a second journeys branch. When the open pull request holds about 20 journeys
(\`git diff --name-only --diff-filter=A origin/<default branch>...HEAD -- tests/journeys
':(exclude)tests/journeys/_*'\` counts them, leaving out findings, quarantines and candidates), cycles stop adding journeys: they re-check quarantines, keep the pull request body current,
and wake rarely until a person merges it.

With no GitHub remote or no \`gh\`: push the branch to the remote you have, leave \`pr: null\`, and put
the pull request title and body you would have used in the cycle report.

### 9. Wrap up

1. Stop every server you started (\`lowdefy_dev_stop({ directory })\`).
2. Update \`last_cycle\` and \`blocked\` in the ledger; commit with \`git status\` clean.
3. Report in two or three lines: journeys added, findings, quarantines, PR url, what is next.
   (Under \`/loop\`, choose the next wake-up now: soon if \`todo\` items remain and the pull request
   is under its cap, else hours.)

## Blocked

If the environment is broken, do not guess and do not ask. Blocked covers:

- the install fails, or the dev server will not start;
- a variable the build or server needs is missing from your environment: name it (a \`_secret\` as
  \`LOWDEFY_SECRET_<NAME>\`), and say how to
  start you with it (export it in the shell that starts the agent, or start the agent through the
  wrapper that injects the app's secrets, such as \`infisical run -- claude\`);
- a stale \`.lowdefy/dev\` that a restart does not cure (see Traps);
- a dev mock user committed in config (\`auth.dev.mockUser\`), which refuses every data set journey;
- a closed journeys pull request (closed unmerged), or a rejected push;
- \`gh\` unauthenticated for the push.

Write \`blocked: <what failed, the command, the error line>\` in the ledger, commit it, say so in the pull
request (or, with no PR, in the report), stop servers and stop. The next cycle starts by retrying the
blocker once; if it is still there, it only restates it.

## Traps

- A stale \`.lowdefy/dev\` from an older Lowdefy version makes \`lowdefy test\` fail with ENOENT on
  \`build/routes.json\`. Reinstall it by starting the dev server once
  (\`lowdefy_dev_start({ directory, restart: true })\`), then stop it and rerun. If a restart does not
  cure it, Blocked.
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
