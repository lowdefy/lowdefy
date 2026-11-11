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

// How to verify a change, which AGENTS.md and the skill both teach. One text, so
// the two never disagree.
const TESTING_RULES = `Test each change at the lowest level that fails when the change breaks. A journey runs a real browser against the dev server, so it is the most expensive check you have.

- Logic, calculations, permissions and what a request writes: call the request or endpoint directly with \`lowdefy_run_request\` or \`lowdefy_run_endpoint\`, passing \`user\`. Add a regression test at that level where the app has one.
- What a page shows, how it reacts and paths across pages: use a journey (\`tests/journeys/\`).
- A table of who can reach what: don't turn it into a journey per role over every page.

Run journeys with \`lowdefy_run_tests\`, or \`lowdefy test --config-directory <app>\` in a terminal:

- While fixing, run only the journey you changed, with \`paths\` and \`filter\`.
- Before you call the change done, run the journeys for the pages the change touches. \`lowdefy journeys scope\` lists those pages.
- Run each journey once. Repeat runs belong to the journey skills, for a journey they write.
- Run the full suite only when a person asks, or in the app's scheduled run.

Terminal runs (\`lowdefy test\`, \`lowdefy journeys harden\`, \`lowdefy journeys variants\`) share the machine with other agents:

- Run journeys only through these commands. Never start \`lowdefy dev\` in a terminal just to run them.
- Each run waits for a journey run slot: 2 machine-wide (1 when memory is short), and 1 per worktree. While it waits it prints who is running. Run one journey runner per worktree and never run suites from parallel subagents; the slots only queue them.
- Exit code 75 means the machine stayed busy for 20 minutes and nothing ran. Wait a few minutes and retry once, then report. Never loop and never start your own dev server. \`LOWDEFY_JOURNEY_RUN_SLOTS=<n>\` sets the machine limit.
- A run boots its own server and stops it at the end, then prints \`Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.\`
- Rerunning journeys while you fix them? Run \`lowdefy hub start .\` in the app folder once, run \`lowdefy test\` as often as you need, then \`lowdefy hub stop .\`. The runs reuse that warm server, print \`Resources: not measured (shared dev server).\`, and ignore \`--ref-resolver\`, \`--port\`, \`--dev-directory\` and \`--server-directory\` with a warning. Stop it when you are done: a running server in a worktree blocks the developer's \`lowdefy dev\` there.`;

export default TESTING_RULES;
