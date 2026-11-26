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

import { type } from '@lowdefy/helpers';

// Whether the run is in CI: the `CI` variable GitHub Actions, GitLab and most CI services set to
// "true". Empty, "false" and "0" say it is not, as a person sets it to switch CI behaviour off.
function isCi({ env }) {
  if (type.isNone(env.CI)) {
    return false;
  }
  return !['', 'false', '0'].includes(String(env.CI).trim().toLowerCase());
}

// The message that fails a `lowdefy test` in CI that skipped browser journeys by default, or
// undefined when the run passes as it is. A CI job that ran a plain `lowdefy test` before v8 ran its
// browser journeys; the same command now runs only the journeys that need no browser, so in CI a
// run given none of --headless, --thorough and --browser (in `options`, from the command line or
// lowdefy.yaml's cli config) fails when it left a journey browser-only, rather than going green
// without it. --build with no mode flag is such a run. Only the journeys a --thorough run takes to
// the browser count: those in `inProcess` (a hold, release or call as system step) no run takes
// there, so no flag would run them. lowdefy_run_tests never calls this: agents run it headless.
function readCiBrowserOnlyFailure({ env, options, browserOnly, inProcess = [], build = false }) {
  if (!isCi({ env })) {
    return undefined;
  }
  if (options.headless === true || options.thorough === true || options.browser === true) {
    return undefined;
  }
  const count = browserOnly.filter((result) => !inProcess.includes(result)).length;
  if (count === 0) {
    return undefined;
  }
  const journeys = count === 1 ? '1 journey needs a browser' : `${count} journeys need a browser`;
  const run = build
    ? 'run them in the browser on the dev server with lowdefy test --thorough, without --build'
    : 'pass --thorough to run them in the browser';
  return `${journeys} and did not run. In CI, lowdefy test without --headless, --thorough or --browser fails when it skips a browser journey. To fix this, ${run}, or pass --headless to say on purpose that browser journeys don't run here.`;
}

export { isCi };
export default readCiBrowserOnlyFailure;
