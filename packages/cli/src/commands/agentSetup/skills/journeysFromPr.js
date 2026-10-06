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

// The journeys-from-pr skill: the coding agent explores a pull request (or,
// for a bug bash, a goal sentence) itself. It reads the scope with
// `lowdefy journeys scope`, looks at each changed page as each role that can
// open it, writes one journey per path a user can take, each with its goal as
// the description, and proves each with `lowdefy test --repeat 3`. Passing
// journeys join the suite; a failing one is a finding, reported with its
// journey. It runs on pull requests only, never nightly or in CI.
function journeysFromPr({ appPath }) {
  const appDirectory = appPath === '' ? 'the worktree root' : `\`${appPath}\` in the worktree`;
  return `---
name: journeys-from-pr
description: Use when the developer wants a pull request explored before it merges, wants journeys for what a PR changed, or wants a bug bash. Looks at each changed page as each role, writes a journey for every path a user can take, keeps the ones that pass and reports the ones that fail as findings with their journey.
---

# Exploring a pull request

You explore the pull request yourself, and what you leave behind is more of the suite. For each
page the pull request changed, and each role that can open it, you look at the page, read its
config, and list the goal of every path a user can take there: not only edge cases and problems,
but also behaviour no journey documents yet. You write one journey per goal and prove each with
\`lowdefy test --repeat 3\`.

- A journey that passes joins the suite.
- A journey that fails, with an app error or because its goal is not met, is a **finding**,
  reported with that journey. The journey fails under \`lowdefy test\` until the bug is fixed, and
  is the regression test after.

You report a finding only with a journey that fails with it. What you think looks broken, or looks
fine, is not a finding. This runs on a pull request, with the developer there: never nightly, never
in CI.

**A bug bash** is this same skill given a goal sentence instead of a pull request, such as "try to
break the invoice form with odd input". Skip steps 1 and 3; take the pages from the sentence, or
from the pages the developer names, and go on from step 4 with the sentence as the direction for
your goals.

## 1. The pull request

Run \`gh pr view <n>\` and tell the developer in one line what the PR changes. Note its base branch.

## 2. A worktree and its dev server

If this checkout is already at the PR's head, use it. Otherwise make one beside the repository:
\`git worktree add --detach ../<repo>-pr-<n>\`, then \`gh pr checkout <n>\` inside it (it handles
forks and gives a branch to keep journeys on), then the repository's install command.

Call \`lowdefy_dev_start({ directory: <the worktree's app directory> })\`, the app directory being
${appDirectory}. Call it again until it reports \`ready\`: a fresh worktree's first install can
outlast one call.

## 3. The scope

Run \`lowdefy journeys scope --base <base branch> --json\` from the app directory (for a bug bash,
\`lowdefy journeys scope --json\` lists every page). Each page in it has:

- \`reasons\`: why it is in scope (its own config, a request, an endpoint, a connection, an
  app-wide change);
- \`blocks\`: the blocks the PR added, changed or removed, with their source lines;
- \`roles\`: who can open it (\`public\`, \`signed-in\` or a role list) and the data set users under
  \`tests/data/\` it admits.

If the app has no data set, or no data set user for a role a page needs, say so and ask the
developer whether to add fixtures and users to one (test data written for journeys, never rows
copied from a real database). You never set \`allowWriteRequests\`; only the developer does.

## 4. Each page, as each role

For each page in scope, and each distinct role set among its \`users\`:

- Look at it: \`lowdefy_screenshot_page({ pageId, user: <data set user>, pathParams })\`.
- Read its config: \`lowdefy_get_page_config({ pageId })\`, and the requests, endpoints and blocks
  the PR changed.
- Write down the goals: every path a user with that role can take on the page, one sentence each,
  starting with what the PR changed. Read the existing journeys on the page in \`tests/journeys/\`
  first and leave out goals they already prove.

## 5. A journey per goal

Write each goal as a journey in \`tests/journeys/<area>/<name>.yaml\`:

- \`name\`: what the journey does, at most 100 characters.
- \`description\`: the goal, at most 60 words: what the journey proves.
- \`data\`: the data set, and \`user\`: the data set user for the role. Every value it types,
  selects, clicks by text or asserts comes from the data set's fixtures or users, or is UI text.
- Steps that reach the goal and \`expect\` steps that check it: the state, text, URL or calls the
  goal is about. After a click that must do something, \`expect: { effect: true }\`.

A data set journey cannot click a block whose events reach a connection the data set does not
redirect (any connection that is not a \`MongoDBCollection\`) or run an auth action: that step
fails and names the block. Leave such a control out and tell the developer it needs a journey off
data sets.

Run \`lowdefy test --lint <path>\`, then \`lowdefy test --repeat 3 <path>\`.

- **PASS:** keep it in \`tests/journeys/\`.
- **FLAKY:** fix the cause, a missing \`wait: { request }\` or a data dependency. Never add
  \`wait: { ms }\`.
- **FAIL:** read the failure. If the journey is wrong (a misspelt block, a wrong expectation of
  what the page shows), fix the journey and run it again. If the app is wrong, it is a finding.

## 6. Findings, one at a time

Show each finding to the developer: the goal, the journey file, the step that failed and what it
expected and found, the app error with its source line when there is one, and a screenshot. Then
the developer decides.

- **A bug:** draft a PR comment saying what broke, where (the source location), the steps to
  reproduce, and the path of the journey that fails with it. Say that the journey is the regression
  test: once the fix lands and \`lowdefy test --repeat 3 <path>\` passes, it stays in the suite.
  Show the draft to the developer, and post it with \`gh pr comment <n> --body-file <file>\` only
  once they approve the text. The comment quotes only config, fixture and typed text.
- **Expected:** the goal was wrong. Rewrite the journey for what the page should do, and prove it
  again.

## 7. Finish

Commit nothing. Leave the journeys on the PR's branch in the worktree, with a summary: the pages
and roles explored, the journeys added, the findings and the comments posted. Ask the developer
whether to stop the dev server (\`lowdefy_dev_stop\`; the hub stops it after 15 idle minutes
anyway) and whether to keep the worktree.
`;
}

export default journeysFromPr;
