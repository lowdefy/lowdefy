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
  browser: \`lowdefy test --headless --build\` runs it on a build. A write journey ends with
  \`expect: { db }\` on what was stored; add \`expect.text\` only when what the page shows is the
  point.
- What a page would never send (another tenant's ids, wrong types, a refused role): a journey with
  no \`pageId\` and \`call\` or \`request\` steps.
- While you edit, call the request or endpoint with \`lowdefy_run_request\` or
  \`lowdefy_run_endpoint\`, passing \`user\` and \`data\`.
- Table-driven cases, computed expected values, fixtures built in code, stubbed services, race tests
  and cron or internal routines: an endpoint test (\`tests/endpoints/\`), never a journey per case.
  "Testing a change" in AGENTS.md has the command.
- Where the app keeps an access table snapshot (an endpoint test that calls \`accessMatrix\`), it is
  the check of who can reach which page and endpoint: write no journey per role and page for it.
  Say in the pull request when that snapshot changed, and why.`;
}

export default testLevel;
