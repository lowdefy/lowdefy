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

import describeValue from './describeValue.js';
import getStepKey from './getStepKey.js';
import validateExpectation from './validateExpectation.js';
import { JOURNEY_STEP_KEYS, PRESS_KEYS, WAIT_KEYS } from './journeyGrammarKeys.js';

function quoteList(keys) {
  return keys.map((key) => `"${key}"`).join(', ');
}

// `fill`, `set` and `select` all address one block and carry one value; a
// `null` value is meaningful (clearing an input), so only `undefined` is
// missing.
function validateBlockValue({ label, params }) {
  if (!type.isObject(params)) {
    return `${label} requires { blockId, value }. Received ${describeValue(params)}.`;
  }
  if (!type.isString(params.blockId)) {
    return `${label} requires a "blockId" string. Received ${describeValue(params.blockId)}.`;
  }
  if (type.isUndefined(params.value)) {
    return `${label} requires a "value". Received ${describeValue(params)}.`;
  }
  return undefined;
}

// A bare string presses on the page; { blockId, key } focuses the block first,
// which is what a keydown recorded on a specific block compiles to.
function validatePress({ label, params }) {
  const requires = `${label} requires a key string such as "Enter" or "Mod+k", or { key, blockId }.`;
  if (type.isString(params)) {
    return undefined;
  }
  if (!type.isObject(params) || !type.isString(params.key)) {
    return `${requires} Received ${describeValue(params)}.`;
  }
  if (!type.isUndefined(params.blockId) && !type.isString(params.blockId)) {
    return `${requires} Received ${describeValue(params)}.`;
  }
  const unknown = Object.keys(params).filter((key) => !PRESS_KEYS.includes(key));
  if (unknown.length > 0) {
    return `${requires} Received ${describeValue(params)}.`;
  }
  return undefined;
}

function validateWait({ label, params }) {
  const key = getStepKey(params);
  if (type.isUndefined(key) || !WAIT_KEYS.includes(key)) {
    return `${label} requires exactly one of ${quoteList(WAIT_KEYS)}. Received ${describeValue(
      params
    )}.`;
  }
  if (key === 'ms' && !type.isNumber(params.ms)) {
    return `${label} requires "ms" to be a number. Received ${describeValue(params.ms)}.`;
  }
  if (key !== 'ms' && !type.isString(params[key])) {
    return `${label} requires "${key}" to be a string. Received ${describeValue(params[key])}.`;
  }
  return undefined;
}

// Validates one step's shape and returns a located message, or undefined when
// the step is well-formed.
function validateStep({ step, index }) {
  const key = getStepKey(step);
  if (type.isUndefined(key)) {
    return `Step ${index} should be an object with exactly one key. Received ${describeValue(
      step
    )}.`;
  }
  if (!JOURNEY_STEP_KEYS.includes(key)) {
    return `Step ${index} has unknown key "${key}". Steps are: ${JOURNEY_STEP_KEYS.join(', ')}.`;
  }
  const label = `Step ${index} "${key}"`;
  const params = step[key];
  switch (key) {
    case 'click':
      if (!type.isString(params)) {
        return `${label} requires a blockId string. Received ${describeValue(params)}.`;
      }
      return undefined;
    case 'fill':
    case 'set':
    case 'select':
      return validateBlockValue({ label, params });
    case 'press':
      return validatePress({ label, params });
    case 'wait':
      return validateWait({ label, params });
    case 'screenshot':
      if (!type.isNone(params) && !type.isString(params)) {
        return `${label} takes an optional name string. Received ${describeValue(params)}.`;
      }
      return undefined;
    default:
      return validateExpectation({ index, params });
  }
}

export default validateStep;
