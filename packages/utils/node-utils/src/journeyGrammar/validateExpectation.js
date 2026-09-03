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
import {
  EXPECT_DOM_KEYS,
  EXPECT_KEYS,
  EXPECT_STATE_KEYS,
  EXPECT_TEXT_KEYS,
} from './journeyGrammarKeys.js';

function quoteList(keys) {
  return keys.map((key) => `"${key}"`).join(', ');
}

function presentKeys({ params, keys }) {
  return keys.filter((key) => !type.isUndefined(params[key]));
}

// `equals` may be absent: that is an expectation waiting for
// `lowdefy test --update` to fill it from the observed state, which the runners
// refuse to pass until it is filled. `from` records that the value in the file
// was written by that run rather than by a human.
function validateState({ label, value }) {
  const requires = `${label(
    'state'
  )} requires { path, equals }, or { path } alone for lowdefy test --update to fill.`;
  if (!type.isObject(value) || !type.isString(value.path)) {
    return `${requires} Received ${describeValue(value)}.`;
  }
  const unknown = Object.keys(value).filter((key) => !EXPECT_STATE_KEYS.includes(key));
  if (unknown.length > 0) {
    return `${label('state')} has unknown key "${unknown[0]}". Keys are: ${quoteList(
      EXPECT_STATE_KEYS
    )}.`;
  }
  if (!type.isUndefined(value.from) && value.from !== 'recorded') {
    return `${label(
      'state'
    )} "from" records where the value came from and can only be "recorded". Received ${describeValue(
      value.from
    )}.`;
  }
  return undefined;
}

function validateVisible({ label, value }) {
  if (!type.isString(value)) {
    return `${label('visible')} requires a blockId string. Received ${describeValue(value)}.`;
  }
  return undefined;
}

// `contains`, `equals` and `notContains` are mutually exclusive so a failure
// names one claim; `notContains` is what proves a thing was removed.
function validateText({ label, value }) {
  if (!type.isObject(value) || !type.isString(value.blockId)) {
    return `${label('text')} requires { blockId } with exactly one of ${quoteList(
      EXPECT_TEXT_KEYS
    )}. Received ${describeValue(value)}.`;
  }
  const present = presentKeys({ params: value, keys: EXPECT_TEXT_KEYS });
  if (present.length !== 1 || !type.isString(value[present[0]])) {
    return `${label('text')} requires { blockId } with exactly one of ${quoteList(
      EXPECT_TEXT_KEYS
    )} as a string. Received ${describeValue(value)}.`;
  }
  return undefined;
}

function validateUrl({ label, value }) {
  if (!type.isObject(value) || !type.isString(value.contains)) {
    return `${label('url')} requires { contains }. Received ${describeValue(value)}.`;
  }
  return undefined;
}

// One assertion per step: a class held, a class not held, a descendant selector
// that must match, or an attribute equal to a value. camelCase throughout, like
// every other key in the grammar.
function validateDom({ label, value }) {
  const requires = `${label('dom')} requires { blockId } with exactly one of ${quoteList(
    EXPECT_DOM_KEYS
  )}, and "equals" with "attribute".`;
  if (!type.isObject(value) || !type.isString(value.blockId)) {
    return `${requires} Received ${describeValue(value)}.`;
  }
  const present = presentKeys({ params: value, keys: EXPECT_DOM_KEYS });
  if (present.length !== 1 || !type.isString(value[present[0]])) {
    return `${requires} Received ${describeValue(value)}.`;
  }
  if (present[0] === 'attribute' && !type.isString(value.equals)) {
    return `${requires} Received ${describeValue(value)}.`;
  }
  if (present[0] !== 'attribute' && !type.isUndefined(value.equals)) {
    return `${requires} Received ${describeValue(value)}.`;
  }
  return undefined;
}

// Asserts the duration the previous step recorded, so a journey can pin a
// regression in how long a request or a render takes.
function validateDurationMsUnder({ label, value, index }) {
  if (!type.isNumber(value)) {
    return `${label('durationMsUnder')} requires a number of milliseconds. Received ${describeValue(
      value
    )}.`;
  }
  if (index === 0) {
    return `${label(
      'durationMsUnder'
    )} measures the previous step, so it cannot be the first step.`;
  }
  return undefined;
}

// Validates the params of an `expect` step. Messages are located by step index
// and name the exact form, so a failure reads as
// `Step 3 "expect.text" requires { blockId } with exactly one of ...`.
function validateExpectation({ index, params }) {
  const label = (form) => `Step ${index} "expect.${form}"`;
  const key = getStepKey(params);
  if (type.isUndefined(key) || !EXPECT_KEYS.includes(key)) {
    return `Step ${index} "expect" requires exactly one of ${quoteList(
      EXPECT_KEYS
    )}. Received ${describeValue(params)}.`;
  }
  const value = params[key];
  switch (key) {
    case 'state':
      return validateState({ label, value });
    case 'visible':
      return validateVisible({ label, value });
    case 'text':
      return validateText({ label, value });
    case 'url':
      return validateUrl({ label, value });
    case 'dom':
      return validateDom({ label, value });
    default:
      return validateDurationMsUnder({ label, value, index });
  }
}

export default validateExpectation;
