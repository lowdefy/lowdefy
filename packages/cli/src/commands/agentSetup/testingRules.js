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
const TESTING_RULES = `Test each change at the lowest level that fails when the change breaks. A journey in a real browser is the most expensive check you have; a journey that targets blocks by \`blockId\` and checks state, calls and the database needs no browser. Each kind of check has one way to write it:

- While you edit, call the request or endpoint on the dev server with \`lowdefy_run_request\` or \`lowdefy_run_endpoint\`, passing \`user\` and \`data\` (a data set user, on a database of its own).
- A page's logic and state, and what it sends and writes: a journey (\`tests/journeys/\`) that needs no browser. Target blocks by \`blockId\` and assert with \`expect.state\`, \`expect.calls\` or \`expect: { db }\`. A write journey ends with \`expect: { db }\` on what was stored. \`lowdefy test --headless --build\` runs these journeys on a build, with no browser.
- Endpoint and server logic: a journey with no \`pageId\` and \`call\`, \`request\` or \`webhook\` steps. That covers what a page would never send (another tenant's ids), data scope, prices and totals, cron and internal endpoints (\`call\` with \`as: system\`), webhooks, outside services (the journey's \`stubs\` with an \`answer\`, checked with \`expect: { sunk }\`), forced failures (\`stubs\` with \`fail\`) and races (\`hold\` and \`release\`). Many cases of one check are one journey with a \`cases\` table, one run per row; write a value the check would compute, such as a price, into its row. Keep shared rows, stubs and steps under \`tests/shared/\` and read them with \`_ref\`. A payload's shape, such as a wrong type, is the endpoint's \`payloadSchema\`; cases test data scope. \`hold\`, \`release\` and \`as: system\` run headless only.
- What a page shows, how it reacts and paths across pages: a journey that checks what the person sees (\`expect.text\`).
- Only what a journey cannot say is a Node test on \`@lowdefy/test-utils\` (\`tests/endpoints/\`): a value computed in code, an answer computed from the request, rows generated in code. The test file says why a journey can't express it. Where the app has such tests, run them once, before you call the change done. They read a build, so every config edit needs a build first; don't run them after each edit. Use the app's own \`package.json\` script, or in the app folder \`lowdefy build --no-client-build && node --test --test-concurrency=4 'tests/endpoints/**/*.test.mjs'\`. See the \`testing/endpoint-tests\` doc.
- Who can reach which page and endpoint: don't turn it into a journey per role over every page. The check is \`tests/access.yaml\`. After a change to auth, roles or the set of pages or endpoints, run \`lowdefy build --no-client-build && lowdefy test --access\` once, before you call the change done, not after each edit. When the changed cells are the ones you meant, run \`lowdefy test --update-access\`, commit the file, and say in the pull request which cells changed and why. An app with auth and no \`tests/access.yaml\` gets one with \`lowdefy build --no-client-build && lowdefy test --update-access\`; commit the table and \`tests/data/roles.yaml\`. Add \`--config-directory <app>\` to each command when the app is not the working directory.

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
