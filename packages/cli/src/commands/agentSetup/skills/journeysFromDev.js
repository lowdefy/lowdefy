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

// The journeys-from-dev skill: a thin workflow over the CLI that reads the
// session the developer means as a log, decides what they were proving, writes
// journeys for it and proves each one, leaving the developer to decide what to
// keep. The pass is decided only by the runner.
function journeysFromDev({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  return `---
name: journeys-from-dev
description: Use when the developer wants journeys (tests) for something they just tried in the dev server, or says 'turn what I clicked into tests'. Reads their recorded dev session as a log, writes journeys for what they were proving, and proves each one before proposing it.
---

# Journeys from what the developer tried

\`lowdefy dev\` records how the developer uses the app in the browser to \`.lowdefy/traces/\`, on
their machine. This skill reads one of those sessions as a log and turns what the developer was
proving into journeys (tests in \`tests/journeys/\`). Run every command below from the app
directory (\`${cd}…\`).

You write the journeys. The runner decides whether they pass: keep only journeys that pass three
runs in a row.

## 1. Find the session

Run \`${cd}lowdefy journeys session --since <window>\` (for example \`--since 2h\`), or call the
\`lowdefy_journey_session\` tool with \`since\`. Each line is one session: its id, when it ran,
the pages it visited, how many interactions it holds and how many failed. Describe them in plain
words ("you tried tickets 3 times; one attempt ended in a validation error on Assign") and ask
which one the developer meant. Default to the newest. Work from that one session, never from
every session in the window.

If there are no sessions, say whether recording is off (\`LOWDEFY_DEV_RECORD=false\` in the
shell or \`.env\`) or the window is wrong, and stop.

## 2. Read its log

Run \`${cd}lowdefy journeys session <id>\` (or \`lowdefy_journey_session\` with \`id\`). Each line
is one interaction with what the app did in response:

\`\`\`
page ticket-new
fill title "Quarterly"
click save → Validate failed [priority]
fill priority "high"
click save → ran Validate, Link, request createTicket ok
page tickets
\`\`\`

\`page\` lines are page views, \`ran\` lists the actions an event ran, \`request\` and
\`endpoint\` say what was called and whether it succeeded, \`state\` what was written, and a
failure names the action and the invalid blocks. \`(config rebuilt)\` marks a config edit.

## 3. Decide what the developer was proving

Read the log with the page's config. Say in plain words what each attempt was for. A failed
attempt followed by a fix is two things worth keeping: the validation the failure shows (a
journey that submits without the field and expects it to fail) and the flow that works. Leave
out what was incidental: a stray click, a reopened menu, steps before a config edit that the
edit made obsolete.

## 4. Write the journeys

- One journey per thing proven, in \`tests/journeys/\`, named after what the person did (\`name\`,
  at most 100 characters).
- Steps follow the log: the same targets, in the same order. Use the typed values from the log,
  unless the journey gets a \`data:\` set. Then every value it types, selects, clicks by text or
  asserts that is not UI text comes from the data set's \`fixtures\` or \`users\`; add the fixture
  records the journey needs when none fit. Those records are test data written for the journey,
  never rows copied from the developer's database with credentials, tokens or external ids intact.
- Assert outcomes: a \`wait: { request }\` for each request a step runs, an \`expect\` for what
  it changes (the state the app wrote, the text or block it shows, the page it moves to). Never
  assert an id the app generated (a new record's id, a timestamp): it differs on every run.
- A \`fill <block> (password, not recorded)\` line means the developer signed in through the app.
  Data set users carry no credentials. When signing in is incidental to the flow, drop the
  sign-in steps and act as a data set user or an inline \`user:\`. When signing in is the point,
  leave \`data:\` off (auth journeys stay on the auth harness) and use the harness's test
  credential, or ask the developer.
- If \`tests/data/\` exists, pick its \`data:\` set for any journey that writes. If it writes and
  no data set exists, say that it will write to whatever the app's connections point at, and ask
  before running it.
- Skip what the suite already proves: run \`${cd}lowdefy test --lint\` and look at the journeys
  on the same page first.

## 5. Prove it: three runs

Run \`${cd}lowdefy test --repeat 3 tests/journeys/<file>.yaml\`. It records nothing.

- **PASS** (three passes): keep it.
- **FLAKY** (one or two failures): fix the cause, a missing \`wait: { request }\` or a data
  dependency. Never add \`wait: { ms }\`. Then run it three more times.
- **FAIL** (three failures): read the failure. A step you wrote wrong, fix and run again. A
  journey that does what the log shows and still fails is a finding (a bug, or behaviour that
  changed since the session): show the developer the journey and its failing step, and let them
  decide whether it stays as a failing test until the bug is fixed.

## 6. Leave it for the developer

Commit nothing. Leave the files and a short summary of what was kept, left out and found.
`;
}

export default journeysFromDev;
