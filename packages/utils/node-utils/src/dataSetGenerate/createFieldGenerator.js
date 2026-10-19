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

import createRandom from './createRandom.js';
import wordLists from './wordLists.js';

function pick({ random, values }) {
  return values[Math.floor(random() * values.length)];
}

function pickWeighted({ random, values, weights }) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = random() * total;
  for (let index = 0; index < values.length; index += 1) {
    remaining -= weights[index];
    if (remaining < 0) return values[index];
  }
  return values[values.length - 1];
}

function makeNumber({ random, min, max, decimals }) {
  if (decimals === 0 && Number.isInteger(min) && Number.isInteger(max)) {
    return min + Math.floor(random() * (max - min + 1));
  }
  const factor = 10 ** decimals;
  const value = Math.round((min + random() * (max - min)) * factor) / factor;
  return Math.min(Math.max(value, min), max);
}

function makeText({ random, minWords, maxWords }) {
  const count = minWords + Math.floor(random() * (maxWords - minWords + 1));
  const words = Array.from({ length: count }, () => pick({ random, values: wordLists.words }));
  words[0] = `${words[0][0].toUpperCase()}${words[0].slice(1)}`;
  return words.join(' ');
}

function makeEmail({ random }) {
  const first = pick({ random, values: wordLists.firstNames });
  const last = pick({ random, values: wordLists.lastNames });
  const domain = pick({ random, values: wordLists.emailDomains });
  return `${first}.${last}@${domain}`.toLowerCase();
}

function makeCompany({ random }) {
  return [
    pick({ random, values: wordLists.companyFirst }),
    pick({ random, values: wordLists.companySecond }),
    pick({ random, values: wordLists.companySuffixes }),
  ].join(' ');
}

// A function that makes one generated field's value for document `index`. Each field has its own
// random source, keyed by the seed, connection and field, so adding a field or a connection leaves
// every other field's values as they were. `refIds` are the _ids a ref field picks from.
function createFieldGenerator({ seed, connectionId, field, spec, refIds }) {
  const random = createRandom({ key: `${seed}/${connectionId}/${field}` });
  switch (spec.kind) {
    case 'literal':
      return () => structuredClone(spec.value);
    case 'oneOf':
      return () =>
        structuredClone(pickWeighted({ random, values: spec.values, weights: spec.weights }));
    case 'number':
      return () => makeNumber({ random, ...spec });
    case 'date':
      return () => ({
        '~d': new Date(spec.from + Math.floor(random() * (spec.to - spec.from + 1))).toISOString(),
      });
    case 'text':
      return () => makeText({ random, ...spec });
    case 'name':
      return () =>
        `${pick({ random, values: wordLists.firstNames })} ${pick({
          random,
          values: wordLists.lastNames,
        })}`;
    case 'email':
      return () => makeEmail({ random });
    case 'company':
      return () => makeCompany({ random });
    case 'sequence':
      return (index) =>
        spec.prefix === null ? spec.start + index : `${spec.prefix}${spec.start + index}`;
    case 'ref':
      return () => structuredClone(pick({ random, values: refIds }));
    default:
      throw new Error(`Unknown generate kind "${spec.kind}".`);
  }
}

export default createFieldGenerator;
