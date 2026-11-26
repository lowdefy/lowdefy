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

import readHeadlessConcurrency from './readHeadlessConcurrency.js';
import readJourneyConcurrency from './readJourneyConcurrency.js';

const ONE_AT_A_TIME = { size: 1, readLimit: () => 1 };

// How many journeys a `lowdefy test` or lowdefy_run_tests run keeps in flight, for its `runner`
// (readTestMode): { headless: { size, readLimit }, browser: { readLimit } } or { error }. A
// concurrency the run was given (`concurrency` when `typed`, named `name` in a refusal) sets how
// many journeys run at once in each part of the run: its headless journeys (readHeadlessConcurrency)
// and its browser journeys, 1 to 3 (readJourneyConcurrency). Untyped, the browser part runs at
// lowdefy.yaml's cli config or LOWDEFY_JOURNEY_CONCURRENCY, else 1, and the headless part at the
// headless default, on the production build and on a dev server alike: both run headless journeys
// in worker threads, and the dev server's journey pool bounds its threads by the same rule.
function readRunConcurrency({
  runner,
  concurrency,
  typed,
  name,
  repeat,
  cores,
  memory,
  env,
  readPressure,
}) {
  const readHeadless = () =>
    readHeadlessConcurrency({ concurrency, typed, name, repeat, cores, memory, readPressure });
  if (runner === 'headless') {
    const headless = readHeadless();
    if (headless.error) {
      return { error: headless.error };
    }
    return { headless, browser: ONE_AT_A_TIME };
  }
  const browser = readJourneyConcurrency({ concurrency, name, repeat, env, readPressure });
  if (browser.error) {
    return { error: browser.error };
  }
  return { headless: runner === 'mixed' ? readHeadless() : ONE_AT_A_TIME, browser };
}

export default readRunConcurrency;
