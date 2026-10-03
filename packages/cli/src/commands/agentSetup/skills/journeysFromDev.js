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

// The journeys-from-dev skill: a thin workflow over the CLI that turns what
// the developer just tried in the dev server into candidate journeys, proves
// each one, and leaves the developer to decide what to keep.
function journeysFromDev({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  return `---
name: journeys-from-dev
description: Use when the developer wants journeys (tests) for something they just tried in the dev server, or says 'turn what I clicked into tests'. Compiles their recorded dev session into candidate journeys and proves each one before proposing it.
---

# Journeys from what the developer tried

\`lowdefy dev\` records how the developer uses the app in the browser to \`.lowdefy/traces/\`, on
their machine. This skill turns one of those recordings into journeys (tests in
\`tests/journeys/\`). Run every command below from the app directory (\`${cd}…\`).

You edit candidates; you never write a step the compiler did not produce from the recording.

## 1. Find the session

Run \`${cd}lowdefy journeys recordings --since <window> --json\` (for example \`--since 2h\`).
Describe the sessions in plain words ("you tried tickets 3 times; one attempt ended in a
validation error on Assign") and ask which one the developer meant. Default to the newest
session on the current build. Each session also says how many of its interactions the suite
already covers.

If there are no recordings, say whether recording is off (\`LOWDEFY_DEV_RECORD=false\` in the
shell or \`.env\`) or the window is wrong, and stop.

## 2. Compile candidates

Run \`${cd}lowdefy journeys compile --source dev --since <window> [--build current] [--page <id>]\`.
It writes candidates to \`tests/journeys/_candidates/dev/\`, which \`lowdefy test\` does not run
on its own.

## 3. Review one candidate at a time

- Name it after what the person did.
- Keep the recorded values, unless the candidate gets a \`data:\` set. Then every value it types,
  selects, clicks by text or asserts that is not UI text comes from the data set's \`fixtures\` or
  \`users\`; add the fixture records the journey needs when none fit. Those records are test data
  written for the journey, never rows copied from the developer's database with credentials,
  tokens or external ids intact.
- A \`from: shape\` placeholder (a redacted password) means the recording signed in through the
  app. Data set users carry no credentials. When signing in is incidental to the flow, drop the
  sign-in steps and act as a data set user or an inline \`user:\`. When signing in is the point,
  leave \`data:\` off (auth journeys stay on the auth harness) and fill the value from the harness's
  test credential, or ask the developer.
- Keep the \`expect.state\` lines that are the point of the flow and drop the incidental ones. Say
  which you dropped.
- Drop a candidate whose path the suite already drives (the coverage from step 1).
- If \`tests/data/\` exists, pick its \`data:\` set. If the candidate writes and no data set exists,
  say that it will write to whatever the app's connections point at, and ask before running it.

## 4. Prove it: three runs

Run \`${cd}lowdefy test --repeat 3 tests/journeys/_candidates/dev/<file>.yaml\`. It runs a journey
from any path and records nothing. (\`lowdefy test --filter\` cannot reach a candidate: discovery
reads \`tests/journeys/*.yaml\` without descending.)

- **PASS** (three passes): move the file from \`tests/journeys/_candidates/dev/\` to
  \`tests/journeys/\`.
- **FLAKY** (one or two failures): fix the cause, a missing \`wait: { request }\` or a data
  dependency. Never add \`wait: { ms }\`. Then run it three more times.
- **FAIL** (three failures): report it to the developer as a finding (a bug, or behaviour that
  changed since the recording), not as a test.

## 5. Leave it for the developer

Commit nothing. Leave the files and a short summary of what was kept, dropped and found.
`;
}

export default journeysFromDev;
