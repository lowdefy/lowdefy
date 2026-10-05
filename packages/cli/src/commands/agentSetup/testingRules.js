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
- In a terminal the same runs are \`lowdefy test --tier common\` and \`lowdefy test --tier edge\`.
- A tier is refused when the app has too little production use pulled; then run without \`tier\`.`;

export default TESTING_RULES;
