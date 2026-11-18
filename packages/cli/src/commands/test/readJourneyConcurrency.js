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

import readMemoryPressure from '../hub/readMemoryPressure.js';

const DEFAULT_CONCURRENCY = 1;
// The machine's browser slots (server-dev's acquireBrowserSlot): a fourth journey would only wait.
const MAX_CONCURRENCY = 3;
const ENV_NAME = 'LOWDEFY_JOURNEY_CONCURRENCY';

function parseConcurrency({ value, name }) {
  const concurrency = Number(value);
  if (
    (!type.isNumber(value) && !type.isString(value)) ||
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > MAX_CONCURRENCY
  ) {
    return {
      error: `${name} must be an integer from 1 to ${MAX_CONCURRENCY}. Received ${JSON.stringify(
        value
      )}.`,
    };
  }
  return { concurrency };
}

// How many browser journeys one test run keeps in flight: { readLimit } or { error }. The limit is
// `concurrency` (named `name` in a refusal: --concurrency, or lowdefy_run_tests' concurrency),
// else LOWDEFY_JOURNEY_CONCURRENCY, else 1, each 1 to 3. A --repeat run measures flakiness, so it
// runs one at a time: a journey that fails only beside another is the flakiness it was asked to
// find. readLimit() reads memory pressure on each call (the pool calls it before starting a
// second journey) and gives 1 while it is warn or critical. Headless runs do not call this: they
// run one at a time.
function readJourneyConcurrency({
  concurrency: value,
  name,
  repeat,
  env = process.env,
  readPressure = readMemoryPressure,
}) {
  let concurrency = DEFAULT_CONCURRENCY;
  if (!type.isNone(value)) {
    const parsed = parseConcurrency({ value, name });
    if (!type.isUndefined(parsed.error)) {
      return { error: parsed.error };
    }
    concurrency = parsed.concurrency;
  } else if (!type.isNone(env[ENV_NAME])) {
    const parsed = parseConcurrency({ value: env[ENV_NAME], name: ENV_NAME });
    if (!type.isUndefined(parsed.error)) {
      return { error: parsed.error };
    }
    concurrency = parsed.concurrency;
  }
  if (concurrency === 1 || repeat > 1) {
    return { readLimit: () => 1 };
  }
  return {
    readLimit: () => {
      const pressure = readPressure();
      if (pressure === 'warn' || pressure === 'critical') {
        return 1;
      }
      return concurrency;
    },
  };
}

export default readJourneyConcurrency;
