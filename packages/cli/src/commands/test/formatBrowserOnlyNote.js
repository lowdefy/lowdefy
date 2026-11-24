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

// The note after a mixed run's summary when it left journeys browser-only. A journey the headless
// part found needs a browser partway through is not run in the browser in the same run (only
// --thorough does that), and the next run sends it straight there while it and the app's config
// are unchanged (routeJourney). `inProcess` counts the browser-only journeys with a step only the
// headless runner takes (runsOnlyInProcess), which no run sends to the browser, so the note names
// them apart rather than promise them a browser run. A thorough run ran the others in the browser,
// so it names only those. Undefined otherwise: a headless run lists its browser-only journeys by
// design. `tool` names the lowdefy_run_tests tool and its argument instead of the command and its
// flag.
function formatBrowserOnlyNote({
  runner,
  thorough = false,
  browserOnly,
  inProcess = 0,
  tool = false,
}) {
  if (runner !== 'mixed') {
    return undefined;
  }
  const lines = [];
  if (!thorough && browserOnly > inProcess) {
    const [next, thoroughRun] = tool
      ? ['lowdefy_run_tests', 'thorough: true']
      : ['lowdefy test', 'lowdefy test --thorough'];
    const which = inProcess > 0 ? 'the other browser-only journeys' : 'the browser-only journeys';
    lines.push(
      `The next ${next} runs ${which} in the browser while they and the app config are unchanged; ${thoroughRun} runs them there in this run.`
    );
  }
  if (inProcess === 1) {
    lines.push(
      '1 browser-only journey also has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.'
    );
  }
  if (inProcess > 1) {
    lines.push(
      `${inProcess} browser-only journeys also have a hold, release or call as system step, which only the headless runner takes, so no run takes them to the browser.`
    );
  }
  if (lines.length === 0) {
    return undefined;
  }
  return lines.join(' ');
}

export default formatBrowserOnlyNote;
