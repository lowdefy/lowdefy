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

// How to verify a change with the app's journeys, which AGENTS.md and the
// skill both teach. One text, so the two never disagree.
const TESTING_RULES = `Verify a change by running the app's journeys (\`tests/journeys/\`) with \`lowdefy_run_tests\`:

- Run \`tier: common\` first: the most-used journeys, ranked by production use, a quick check of the
  happy paths.
- Widen to \`tier: edge\` before you call the change done: the edge cases real users still reach.
  Journeys with no production counts for their current steps run in every tier.
- In a terminal the same runs are \`lowdefy test --config-directory <app> --tier common\` and
  \`lowdefy test --config-directory <app> --tier edge\`.
- A tier is refused when the app has too little production use pulled; then run without \`tier\`.

Terminal runs (\`lowdefy test\`, \`lowdefy journeys harden\`, \`lowdefy journeys variants\`) share the machine with other agents:

- Run journeys only through these commands. Never start \`lowdefy dev\` in a terminal just to run them.
- Each run waits for a journey run slot: 2 machine-wide (1 when memory is short), and 1 per worktree. While it waits it prints who is running. Run one journey runner per worktree and never run suites from parallel subagents; the slots only queue them.
- Exit code 75 means the machine stayed busy for 20 minutes and nothing ran. Wait a few minutes and retry once, then report. Never loop and never start your own dev server. \`LOWDEFY_JOURNEY_RUN_SLOTS=<n>\` sets the machine limit.
- A run boots its own server and stops it at the end, then prints \`Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.\`
- Rerunning journeys while you fix them? Run \`lowdefy hub start .\` in the app folder once, run \`lowdefy test\` as often as you need, then \`lowdefy hub stop .\`. The runs reuse that warm server, print \`Resources: not measured (shared dev server).\`, and ignore \`--ref-resolver\`, \`--port\`, \`--dev-directory\` and \`--server-directory\` with a warning. Stop it when you are done: a running server in a worktree blocks the developer's \`lowdefy dev\` there.`;

export default TESTING_RULES;
