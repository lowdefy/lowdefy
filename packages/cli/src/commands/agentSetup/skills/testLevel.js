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

// Where a journeys skill sends each kind of check. The skills write journeys,
// so each says which checks a journey takes and which go elsewhere, in the
// words of "Testing a change" in AGENTS.md (testingRules.js).
function testLevel() {
  return `## Where each check lives

Each check has one home, so it is never written twice:

- A page's logic, state and what it writes: one journey that targets blocks by \`blockId\` and
  asserts with \`expect.state\`, \`expect.calls\` or \`expect: { db }\`. Such a journey needs no
  browser: \`lowdefy test --build\` runs it on a build. A write journey ends with
  \`expect: { db }\` on what was stored; add \`expect.text\` only when what the page shows is the
  point.
- Endpoint and server logic, and what a page would never send (another tenant's ids): a journey with
  no \`pageId\` and \`call\`, \`request\` or \`webhook\` steps. Many cases of one check are one
  journey with a \`cases\` table; outside services and forced failures are its \`stubs\`; races are
  \`hold\` and \`release\`; cron and internal endpoints are \`call\` with \`as: system\`.
- While you edit, call the request or endpoint with \`lowdefy_run_request\` or
  \`lowdefy_run_endpoint\`, passing \`user\` and \`data\`.
- Only what a journey cannot say, such as a value computed in code or an answer computed from the
  request, is a Node test on \`@lowdefy/test-utils\` (\`tests/endpoints/\`), and the file says why.
  "Testing a change" in AGENTS.md has the command.
- Who can reach which page and endpoint: \`tests/access.yaml\` is the check, so write no journey per
  role and page for it. After a change to auth, roles or the set of pages or endpoints, run
  \`lowdefy build --no-client-build && lowdefy test --access\` once. Update the file with
  \`lowdefy test --update-access\` when the changed cells are the ones meant, and say in the pull
  request which cells changed and why.

\`lowdefy test\` runs journeys headless. A journey that needs a browser is not run: it shows as
\`BROWSER-ONLY\` with the step that needs one, never as PASS, and the summary prints the command
that runs it in the browser. When a journey you write shows \`BROWSER-ONLY\`, rewrite that step so it
needs no browser; when the step checks something only a browser shows, prove the journey with
\`--thorough\` added to the same command. Add \`--thorough\` or \`--browser\` to other runs only
when a person asks.`;
}

export default testLevel;
