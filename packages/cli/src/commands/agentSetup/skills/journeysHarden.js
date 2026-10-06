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

// The journeys-harden skill: a thin workflow over the CLI that proves the
// app's journeys are worth keeping. It replays and lints them, runs config
// mutants to find what no journey would notice, writes edge-case variants,
// and turns each finding into an assertion the developer approves. It never
// deletes a journey, or proposes deleting one.
function journeysHarden({ appPath }) {
  const cd = appPath === '' ? '' : `cd ${appPath} && `;
  return `---
name: journeys-harden
description: Use when the developer wants to know whether the app's journeys would catch a broken feature, wants edge-case journeys, or wants candidates proven before committing them. Replays, lints and mutation-tests journeys and writes edge-case variants; never deletes a journey.
---

# Harden journeys

Journeys (tests in \`tests/journeys/\`) pass, but a journey that passes may check nothing, may
pass only some of the time, and leaves the edge cases unwritten. This skill proves them with the
developer, one finding at a time. Run every command below from the app directory (\`${cd}…\`).

Two rules hold throughout:

- **Never delete a journey, and never propose deleting one.** A 30-day window of production use
  cannot see an annual review, a year-end close or a quarterly import, and a journey that is the
  only one to kill a mutant is load-bearing whatever its traffic. The developer decides. A
  variant candidate in \`_candidates/\` is not yet a journey of the suite.
- **Write no step the compiler or the variants generator did not produce**, except an assertion
  the developer approved. Never add \`wait: { ms }\`: lint L3 refuses it.

## 1. Replay

Run \`${cd}lowdefy test --repeat 3\`, and \`${cd}lowdefy test --repeat 3 tests/journeys/_candidates/\`
when that directory has files. Replay first: each run records what the journey exercised in
\`.lowdefy/test/exercised.json\`, which the lints read.

- **PASS** (three passes): good.
- **FLAKY** (one or two failures): fix the cause, usually a missing \`wait: { request }\`, a data
  dependency, or a target that matches two elements. Then run it three more times.
- **FAIL** (three failures): take it to the developer as a finding. Someone did this and it
  breaks now: either a bug or a behaviour change. The developer says which.

## 2. Lint

Run \`${cd}lowdefy test --lint\`, and \`${cd}lowdefy test --lint tests/journeys/_candidates/\`.
Fix lint errors in candidates within the two rules above. Take any you cannot fix, and every fix
to a committed journey, to the developer one at a time.

## 3. Size the run

Only journeys with a data set (\`data:\`) can be hardened: mutant runs write through the app's
connections, and without a data set that is the developer's own database. harden leaves out
every journey without \`data:\` and names it. Tell the developer which ones were left out; moving
a journey onto a data set is their call.

Run \`${cd}lowdefy journeys harden --list\`. Show the developer how many mutants it would run per
page and operator and the time estimate, and ask whether to run all of it or only some pages
(\`--page <pageId>\`). Wait for the answer.

## 4. Harden

Run \`${cd}lowdefy journeys harden\` (with the pages the developer picked). It breaks the config
one change at a time, only in the test's own browser, and reports each change no journey
noticed as \`SURVIVED\`, with its source line. Take survivors one at a time, ranked by the
production use of their page when \`.lowdefy/test/coverage.json\` has it, else in report order.
For each survivor:

- Show what was changed, where (\`source\`), and which journeys passed anyway.
- Propose the assertion that would catch it, placed after the step that exercises it:
  \`expect.text\` of the message, \`expect.state\`, \`expect.visible\`, \`expect.hidden\` or
  \`expect.calls\`.
- On the developer's yes, edit the journey, then confirm with
  \`${cd}lowdefy journeys harden --mutant <id>\` (it is now killed) and
  \`${cd}lowdefy test --repeat 3 <file>\` (still green).
- If no assertion can catch it because the config is dead, say so: that is a finding about the
  app, not about the test.

List \`unapplied\` mutants separately, with their misses: they are a defect in harden itself to
report, never an assertion to add.

## 5. Variants

Run \`${cd}lowdefy journeys variants <file>\` for the journeys the developer picks; offer the most
production-backed ones first. It writes edge-case candidates (other roles, another organization,
empty and large data, bad input, a reload mid-flow, a double click) to
\`tests/journeys/_candidates/variants/<source>/\` and replays each three times. Present failures one at a
time: is it a bug, or behaviour to assert as expected? A FLAKY variant gets its cause fixed. A
variant with a \`from: shape\` placeholder needs the value its comment asks for before it runs.

When the developer keeps a variant:

- A **role, granted** variant that passes is the same flow for another role, so it joins the
  original journey rather than becoming a copy of it. Add its user to the original journey's
  \`user\` list (\`user: member\` becomes \`user: [member, admin]\`; the variant's first comment
  names the list), and the variant file then goes, so the steps stay in one place. A journey with
  a list of users runs once as each, reported as \`<name> [<user>]\`.
- Every other variant, a **role, refused** one included (it expects a different outcome: \`/404\`
  or the feature hidden), moves into \`tests/journeys/\` as a journey of its own.

## 6. Evidence

Run \`${cd}lowdefy journeys evidence --refresh\`, so the mutation scores land in each journey's
\`evidence:\`.

## 7. Report

Report to the developer:

- the journeys with no production backing in the window, with their mutation kills and unique
  kills exactly as \`lowdefy journeys evidence\` prints them, and no proposal to delete any of them;
- journeys whose \`sequence\` in \`.lowdefy/test/coverage.json\` duplicates another's;
- pages with production use in \`coverage.json\` (\`production.entryPoints\`,
  \`production.roleMatrix\`) that no journey starts on or reaches.

## 8. Leave it for the developer

Commit nothing. Leave the changes on the working branch and a short summary of the assertions
added, the variants kept and the findings.
`;
}

export default journeysHarden;
