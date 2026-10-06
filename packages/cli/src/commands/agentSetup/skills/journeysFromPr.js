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
// takes the developer through proven findings and then candidate journeys.
// It never writes a step the compiler did not produce, never
// overrules an invariant, and posts a PR comment only with text the developer
// approved that carries only config, fixture and typed text.
function journeysFromPr({ appPath }) {
  const appDirectory = appPath === '' ? 'the worktree root' : `\`${appPath}\` in the worktree`;
  return `---
name: journeys-from-pr
description: Use when the developer wants a pull request explored before it merges, or wants journeys for what a PR changed. Walks the changed pages as each role on a data set, reports findings proven by failing journeys first, then proposes journeys and proves each before suggesting it.
---

# Journeys from a pull request

\`lowdefy journeys explore\` finds the pages a pull request changed, walks each as each role on a
journey data set, and compiles the walks into candidate journeys. It reports a finding only once
a journey written for it fails twice: that journey is the proof, and it becomes the regression test
once the bug is fixed. This skill runs it with the developer, findings first, then candidates.

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
\`findings.json\`, \`walks.jsonl\`, \`report.json\` and \`screenshots/\`. Its candidates are in
\`tests/journeys/_candidates/explorer/<run>/\`, with each proven finding's journey under
\`findings/\`.

A run on \`--live-data\` or \`--allow-external\` proves nothing, since a proof would replay writes on
live connections. Its findings are all listed as not proven; offer to rerun on a data set.

## 5. Proven findings first, one at a time

Show each proven finding, errors first, then dead clicks: its kind, its source location, the walk's
steps up to it (from \`walks.jsonl\`), its screenshot, and its journey (the finding's
\`candidate\` in \`findings.json\`). The journey fails under \`lowdefy test\` today, and it is
the finding's proof: the run ran it twice and it failed with the finding both times. Then the
developer decides.

- **A bug:** draft a PR comment saying what broke, where (the source location), the steps to
  reproduce, and the path of the journey that fails with it. Say that the journey is the
  regression test: once the fix lands and \`lowdefy test --repeat 3 <path>\` passes, it moves into
  \`tests/journeys/\`. Show the draft to the developer, and post it with
  \`gh pr comment <n> --body-file <file>\` only once they approve the text. The comment's steps
  and message keep only config, fixture and typed text, every other value is written \`<data>\`,
  and no screenshot is attached.
- **Expected:** leave that finding's journey out of what you keep.

A proven dead click ends in \`expect: { effect: true }\`, which the explorer adds by a fixed rule:
it shows the control did nothing. Ask the developer whether it should do something. If it should,
treat it as a bug; if not, leave its journey out.

When the bug is fixed, run \`lowdefy test --repeat 3 <path>\` on its journey. On three passes, move
the file into \`tests/journeys/\` and name it after what it checks.

Findings that are not proven are listed in \`report.json\` by reason (\`not-reproduced\`,
\`environment\`, \`no-candidate\`, \`live-writes\`). Mention each in one line: nothing proves
them, and they have no journey.

## 6. Coverage candidates, one at a time

For each coverage candidate in \`tests/journeys/_candidates/explorer/<run>/\`:

- Name it after what it does.
- Keep the \`expect.state\` lines that are the point of the journey.
- Run \`lowdefy test --lint <path>\`.
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
