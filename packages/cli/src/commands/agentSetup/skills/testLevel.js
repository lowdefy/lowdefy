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

// What a journeys skill says about the checks that are not a journey's. The
// skills write journeys, so each says where logic, permissions and writes are
// proved instead, in the words of "Testing a change" in AGENTS.md
// (testingRules.js).
function testLevel() {
  return `## What is not a journey

A journey proves what only a browser shows: what a page shows, how it reacts and paths across pages.
Logic, calculations, permissions and what a request or endpoint writes are proved one level down,
never by adding a journey:

- Call the request or endpoint with \`lowdefy_run_request\` or \`lowdefy_run_endpoint\`, passing
  \`user\` and \`data\`.
- Where the app has endpoint tests (\`tests/endpoints/\`), the regression test for such a check is an
  endpoint test: add or update one, and run them once before you call the work done. "Testing a
  change" in AGENTS.md has the command.
- Where the app keeps an access table snapshot (an endpoint test that calls \`accessMatrix\`), it is
  the check of who can reach which page and endpoint: write no journey per role and page for it.
  Say in the pull request when that snapshot changed, and why.`;
}

export default testLevel;
