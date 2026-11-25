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
// (readTestMode): { headless: { size, readLimit }, browser: { readLimit } } or { error }. A headless
// run's concurrency sizes its headless journeys (readHeadlessConcurrency): the run was given
// `concurrency` when `typed`, named `name` in a refusal. A mixed or browser run's concurrency sizes
// its browser journeys, 1 to 3 (readJourneyConcurrency, which also reads lowdefy.yaml's cli config
// and LOWDEFY_JOURNEY_CONCURRENCY), and a mixed run's headless part runs at the headless default.
function readRunConcurrency({
  runner,
  concurrency,
  typed,
  name,
  repeat,
  cores,
  env,
  readPressure,
}) {
  if (runner === 'headless') {
    const headless = readHeadlessConcurrency({
      concurrency,
      typed,
      name,
      repeat,
      cores,
      readPressure,
    });
    if (headless.error) {
      return { error: headless.error };
    }
    return { headless, browser: ONE_AT_A_TIME };
  }
  const browser = readJourneyConcurrency({ concurrency, name, repeat, env, readPressure });
  if (browser.error) {
    return { error: browser.error };
  }
  return {
    headless:
      runner === 'mixed'
        ? readHeadlessConcurrency({ typed: false, name, repeat, cores, readPressure })
        : ONE_AT_A_TIME,
    browser,
  };
}

export default readRunConcurrency;
