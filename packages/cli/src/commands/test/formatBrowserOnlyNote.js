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

// The note after a mixed run's summary when it left journeys browser-only: a journey the headless
// part found needs a browser partway through is not run in the browser in the same run (only
// --thorough does that), and the next run sends it straight there while it and the app's config
// are unchanged (routeJourney). Undefined otherwise: a headless run lists its browser-only
// journeys by design, and a thorough run runs them. `tool` names the lowdefy_run_tests tool and its
// argument instead of the command and its flag.
function formatBrowserOnlyNote({ runner, browserOnly, tool = false }) {
  if (runner !== 'mixed' || browserOnly === 0) {
    return undefined;
  }
  const [next, thorough] = tool
    ? ['lowdefy_run_tests', 'thorough: true']
    : ['lowdefy test', 'lowdefy test --thorough'];
  return `The next ${next} runs the browser-only journeys in the browser while they and the app config are unchanged; ${thorough} runs them there in this run.`;
}

export default formatBrowserOnlyNote;
