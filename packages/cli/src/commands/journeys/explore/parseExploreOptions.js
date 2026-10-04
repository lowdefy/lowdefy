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

import parseDuration from './parseDuration.js';

const DEFAULT_WALKS = 5;
const DEFAULT_STEPS = 15;
const DEFAULT_BUDGET = '20m';

function parseCount({ value, flag, fallback, min = 1 }) {
  if (type.isNone(value)) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) {
    throw new Error(
      `${flag} should be a whole number of at least ${min}. Received ${JSON.stringify(value)}.`
    );
  }
  return number;
}

function asList(value) {
  if (type.isNone(value)) return [];
  return type.isArray(value) ? value : [value];
}

// The explore command's flags, checked and defaulted. The policy flags
// (--policy, --model, --max-cost) are resolvePolicy's.
function parseExploreOptions(options) {
  if (type.isNone(options.pr) === type.isNone(options.against)) {
    throw new Error('Pass one of --pr <number> or --against <ref>.');
  }
  return {
    pr: options.pr ?? null,
    against: options.against ?? null,
    data: options.data ?? null,
    liveData: options.liveData === true,
    pages: asList(options.page),
    roles: asList(options.role),
    walks: parseCount({ value: options.walks, flag: '--walks', fallback: DEFAULT_WALKS }),
    steps: parseCount({ value: options.steps, flag: '--steps', fallback: DEFAULT_STEPS }),
    budgetMs: parseDuration({ value: options.budget ?? DEFAULT_BUDGET, flag: '--budget' }),
    allowExternal: asList(options.allowExternal),
    seed: parseCount({ value: options.seed, flag: '--seed', fallback: 0, min: 0 }),
    scopeOnly: options.scopeOnly === true,
    json: options.json === true,
    url: type.isString(options.url) && options.url !== '' ? options.url : null,
  };
}

export default parseExploreOptions;
