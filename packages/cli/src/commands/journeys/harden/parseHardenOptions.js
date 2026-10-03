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

function parseInteger({ value, name, fallback, min, max }) {
  if (type.isNone(value)) {
    return { value: fallback };
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || (!type.isUndefined(max) && number > max)) {
    const range = type.isUndefined(max) ? `${min} or more` : `from ${min} to ${max}`;
    return { error: `--${name} must be an integer ${range}. Received ${JSON.stringify(value)}.` };
  }
  return { value: number };
}

function parseList(value) {
  if (type.isNone(value)) {
    return null;
  }
  const items = (type.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter((item) => item !== '');
  return items.length === 0 ? null : items;
}

// The options of `lowdefy journeys harden`, with their defaults: at most 200
// mutants (0: no cap), seed 0, 4 workers.
function parseHardenOptions(options) {
  const max = parseInteger({ value: options.max, name: 'max', fallback: 200, min: 0 });
  if (max.error) return { error: max.error };
  const seed = parseInteger({ value: options.seed, name: 'seed', fallback: 0, min: 0 });
  if (seed.error) return { error: seed.error };
  const workers = parseInteger({
    value: options.workers,
    name: 'workers',
    fallback: 4,
    min: 1,
    max: 16,
  });
  if (workers.error) return { error: workers.error };
  if (!type.isNone(options.mutant) && !type.isString(options.mutant)) {
    return { error: `--mutant must be a mutant id. Received ${JSON.stringify(options.mutant)}.` };
  }
  return {
    max: max.value,
    seed: seed.value,
    workers: workers.value,
    operators: parseList(options.operators),
    pages: parseList(options.page),
    mutant: options.mutant ?? null,
    list: options.list === true,
    json: options.json === true,
  };
}

export default parseHardenOptions;
