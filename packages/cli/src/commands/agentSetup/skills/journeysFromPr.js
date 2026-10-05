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

// The journeys-from-pr skill: a thin workflow over the CLI and the hub's dev
// tools that explores a pull request before it merges. It makes a worktree
// for the PR, starts its dev server through the hub, runs the explorer, then
// takes the developer through confirmed findings and then candidate
// journeys. It never writes a step the compiler did not produce, never
// overrules an invariant, and posts a PR comment only with text the developer
// approved that carries no snapshot data.
function journeysFromPr({ appPath }) {
  const appDirectory = appPath === '' ? 'the worktree root' : `\`${appPath}\` in the worktree`;
  return `---
name: journeys-from-pr
description: Use when the developer wants a pull request explored before it merges, or wants journeys for what a PR changed. Walks the changed pages as each role on a data set, reports confirmed findings first, then proposes journeys and proves each before suggesting it.
---

# Journeys from a pull request

\`lowdefy journeys explore\` finds the pages a pull request changed, walks each as each role on a
journey data set, reports what broke (each finding confirmed by a replay), and compiles the walks
into candidate journeys. This skill runs it with the developer, findings first, then candidates.

You edit candidates; you never write a step the compiler did not produce. You never overrule an
invariant with your own judgement that something looks broken or looks fine: a finding is what the
fixed checks reported, and the developer decides what it means.

## 1. The pull request

Run \`gh pr view <n>\` and tell the developer in one line what the PR changes.

## 2. A worktree

If this checkout is already at the PR's head, use it. Otherwise make one beside the repository:
\`git worktree add --detach ../<repo>-pr-<n>\`, then \`gh pr checkout <n>\` inside it (it
handles forks and gives a branch to keep candidates on), then the repository's install command.

## 3. Its dev server

Call \`lowdefy_dev_start({ directory: <the worktree's app directory> })\`, the app directory being
${appDirectory}. Call it again until it reports \`ready\`: a fresh worktree's first install can
outlast one call. The developer can open that server, and you can use the dev tools against it;
the explorer's walk tabs do not take over the live-tab tools.

## 4. Explore

Run \`lowdefy journeys explore --pr <n>\` from the worktree's app directory.

- **No data set.** If it refuses for want of a data set, ask the developer which data set to use
  (\`--data <name>\`), or whether \`--live-data\` is acceptable, and name the connections it would
  write to. \`--live-data\` also needs \`cli.agentTools.allowWriteRequests: true\` in
  \`lowdefy.yaml\`. You never set \`allowWriteRequests\`; only the developer does.
- **No \`AI_GATEWAY_API_KEY\`.** Say the run uses the seeded policy, which costs nothing but is less
  pointed, and that a Gateway key makes it model-guided.

The run prints its plan, then a summary. Its files are in \`.lowdefy/explore/<run>/\`:
\`findings.json\`, \`walks.jsonl\`, \`report.json\` and \`screenshots/\`.

## 5. Findings first, one at a time

Show each confirmed finding: its kind, its source location, the walk's steps up to it (from
\`walks.jsonl\`) and its screenshot. Then the developer decides.

- **A bug:** draft a PR comment saying what broke, where (the source location), the steps to
  reproduce, and the finding candidate's path under \`tests/journeys/_candidates/explorer/findings/\`.
  Show the draft to the developer, and post it with \`gh pr comment <n> --body-file <file>\` only
  once they approve the text. On a snapshot data set, the comment carries no snapshot data: its
  steps and message keep only config, fixture and typed text, every other value is written
  \`<data>\`, and no screenshot is attached.
- **Expected:** leave that finding candidate out of what you keep.

List dead clicks after the errors, and ask the developer which ones should do something.

A finding candidate is a reproduction: \`lowdefy test\` passes it today, so do not run it three
times. Once the bug is fixed, the developer may keep it as a journey by adding an assertion of the
fixed outcome.

## 6. Coverage candidates, one at a time

For each candidate in \`tests/journeys/_candidates/explorer/\`:

- Name it after what it does.
- On a snapshot data set, retarget each \`row: N\` click to \`containing: <value>\`, the row's
  known-text value (the walk's \`rowText\` in \`walks.jsonl\`).
- Keep the \`expect.state\` lines that are the point of the journey.
- Run \`lowdefy test --lint <path>\`. On a snapshot data set, fix an L7 error on a recorded
  \`pathParams\` or \`urlQuery\` value (on the journey or a \`goto\`) or a \`<data>\` pick by
  switching to a fixture-owned value.
- Run \`lowdefy test --repeat 3 <path>\`. It runs the candidate where it lies and records nothing;
  \`--filter\` cannot reach \`_candidates/\`.
  - **PASS:** move the file into \`tests/journeys/\`.
  - **FLAKY:** fix the cause, a missing \`wait: { request }\` or a data dependency. Never add
    \`wait: { ms }\`.
  - **FAIL:** it is a finding. Take it to the developer as in step 5.

Retargeting a click and leaving out an \`expect.state\` line edit a compiled step; neither writes a
new one.

## 7. Finish

Commit nothing. Leave the journeys on the PR's branch in the worktree, with a summary of the
findings, the comments posted and the journeys kept. Ask the developer whether to stop the dev
server (\`lowdefy_dev_stop\`; the hub stops it after 30 idle minutes anyway) and whether to remove
the worktree.
`;
}

export default journeysFromPr;
