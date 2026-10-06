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

// The journeys-bug-bash skill: writes 3 to 6 charters from the app's pages
// (and the diff, on a branch) to a file outside the repository, then runs
// them as one explore run, unattended through to the report. The merge
// across charters and the proof of each finding are the CLI's; the skill
// never writes an expectation and never runs explore processes in parallel.
function journeysBugBash({ appPath }) {
  const appDirectory = appPath === '' ? 'the repository root' : `\`${appPath}\``;
  return `---
name: journeys-bug-bash
description: Use when the developer wants a bug bash, wants the app explored for bugs without a pull request to follow, or wants several directions tried at once. Writes 3 to 6 charters from the app's pages and runs them as one explore run, unattended, then reports proven findings first.
---

# Bug bash

A bug bash is one \`lowdefy journeys explore\` run over several charters. A charter is a
one-sentence goal that steers which options the explorer's model picks. The run walks every
charter's pages under one budget, merges the findings by key, and proves each finding once, by a
journey that fails with it. You write the charters and run the one command. Everything after that
is the CLI's.

Run it unattended, from the charters to the report, without stopping to ask. You never write an
expectation or a journey step: a finding is what the fixed checks reported and a failing journey
proved. You never run two explore processes at once: the dev server holds two open walks at
most, and one run already walks every charter.

## 1. The dev server

Call \`lowdefy_dev_start({ directory: <the app directory> })\`, the app directory being
${appDirectory}. Call it again until it reports \`ready\`.

## 2. What to aim at

- Call \`lowdefy_app_map\` for the app's pages, their blocks and requests.
- On a branch, run \`git diff --stat <base>...HEAD\` (the base being the branch the work merges
  into, such as \`origin/main\`) for the pages and requests it changed. Aim most charters there.
- Read the data set the run will use, \`tests/data/default.yaml\` (or the only file in
  \`tests/data/\`), for its \`users\`: a charter's \`roles\` are those data set users.

## 3. Write the charters

Write 3 to 6 charters to a file outside the repository, such as
\`$TMPDIR/lowdefy-bug-bash/charters.yaml\`, so nothing of the bug bash lands in a commit. Each
charter is \`{ goal, pages?, roles? }\`:

\`\`\`yaml
- goal: Try edge input on the invoice form.
  pages: [invoice]
- goal: Try error paths on tickets, cancel, delete and incomplete submits.
  pages: [tickets, ticket]
  roles: [member_max]
- goal: Try edge input on every form a new contact touches.
\`\`\`

- **goal**: one sentence. A charter can only steer through the options a walk already generates,
  so give each goal one of two stances: **edge input** (the generated edge values: empty, long,
  invalid) or **error paths** (cancel, delete, incomplete submits).
- **pages**: page ids from \`lowdefy_app_map\`. Without them, the charter walks the run's
  default pages: on a branch, the pages it changed; with no branch, the entry pages.
- **roles**: data set users. Without them, the charter walks as every role the page has.

Spread the charters over different pages and both stances. Several charters on one page are
fine: a finding they both hit is listed once, naming both.

## 4. Run it, once

From the app directory, run:

\`\`\`bash
lowdefy journeys explore --charters <file>
\`\`\`

Add \`--against <base>\` on a branch with no pull request, or \`--pr <n>\` for a pull request, so the
default pages are the ones it changed. Add \`--data <name>\` when the app has several data sets
and no \`default.yaml\`. Leave \`--budget\` at its default unless the developer gave one.

- **No \`AI_GATEWAY_API_KEY\`.** The run is refused: a charter needs a model, and the seeded policy
  never reads it. Stop and tell the developer to set the key in the shell or the app's \`.env\`.
- **No data set.** The run is refused. Stop and tell the developer: a bug bash clicks Save and
  Delete, so it runs on a data set, never on \`--live-data\`.
- **A charter refused** (an unknown page or role, a missing goal): fix that charter in the file
  and run the command again.

The run prints its plan, each walk as it ends, then the summary. Its files are in
\`.lowdefy/explore/<run>/\`, and \`report.json\` there is what you report from.

## 5. Report

\`report.json\` lists the charters, each with its pages, roles and walks, and then the findings,
proven ones first.

- **Proven findings**, errors first, then dead clicks, then role refusals. For each: its kind, its
  source location, its message, the charters that hit it (\`charters\` on the finding), and its
  journey (\`candidate\`). That journey fails under \`lowdefy test\` today: it is the finding's
  proof, and once the bug is fixed and \`lowdefy test --repeat 3 <path>\` passes, it is the
  regression test, to be moved into \`tests/journeys/\`.
- A proven **dead click** shows the control did nothing. Whether it should do something is the
  developer's call; say so.
- **Not proven** findings, grouped by reason (\`not-reproduced\`, \`environment\`, \`no-candidate\`,
  \`live-writes\`): one line each. Nothing proves them, and they have no journey.
- The proof time, from the summary, and any charter that walked nothing (budget), with a
  suggestion to rerun it alone or with a larger \`--budget\`.
- **Pages no charter walked**: \`notRun\` entries with reason \`no-charter\` (\`no charter walks
  it\` in the summary) are pages the branch changed that every charter left out, so nothing
  explored them. Name each one, and suggest a charter for it, or one charter without \`pages\`,
  which walks every changed page.

Commit nothing. The journeys stay in \`tests/journeys/_candidates/explorer/<run>/findings/\` for the
developer. Ask whether to stop the dev server (\`lowdefy_dev_stop\`).
`;
}

export default journeysBugBash;
