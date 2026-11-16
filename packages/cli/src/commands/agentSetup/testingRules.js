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
const TESTING_RULES = `Test each change at the lowest level that fails when the change breaks. A journey in a real browser is the most expensive check you have; a journey that targets blocks by \`blockId\` and checks state, calls and the database needs no browser.

- Logic, calculations, permissions and what a request or endpoint writes: while you edit, call the request or endpoint on the dev server with \`lowdefy_run_request\` or \`lowdefy_run_endpoint\`, passing \`user\` and \`data\` (a data set user, on a database of its own).
- The regression test for such a change is a journey (\`tests/journeys/\`) that needs no browser: target blocks by \`blockId\` and assert with \`expect.state\`, \`expect.calls\` or \`expect: { db }\`. A write journey ends with \`expect: { db }\` on what was stored. What a page would never send (another tenant's ids, wrong types, a refused role) is a journey with no \`pageId\` and \`call\` or \`request\` steps. \`lowdefy test --headless --build\` runs these journeys on a build, with no browser.
- What a page shows, how it reacts and paths across pages: a journey that checks what the person sees (\`expect.text\`).
- Where the app has endpoint tests (\`tests/endpoints/\`, Node tests on \`@lowdefy/test-utils\`): they hold what a journey cannot say, such as table-driven cases, computed expected values, fixtures built in code, stubbed services, race tests and cron or internal routines. Add or update one for such a change, and run them once, before you call the change done. They read a build, so every config edit needs a build first; don't run them after each edit. Use the app's own \`package.json\` script, or in the app folder \`lowdefy build --no-client-build && node --test --test-concurrency=4 'tests/endpoints/**/*.test.mjs'\`. See the \`testing/endpoint-tests\` doc.
- A table of who can reach what: don't turn it into a journey per role over every page. Where the app keeps an access table snapshot (an endpoint test that calls \`accessMatrix\`), that is the check. When a change alters the snapshot, update it and say in the pull request that it changed and why.

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
