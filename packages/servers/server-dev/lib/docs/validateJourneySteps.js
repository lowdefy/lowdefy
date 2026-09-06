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

const STEP_KEYS = ['click', 'fill', 'select', 'press', 'wait', 'screenshot', 'expect'];
const EXPECT_KEYS = ['state', 'visible', 'text', 'url'];
const WAIT_KEYS = ['ms', 'request', 'state'];

function describe(value) {
  return JSON.stringify(value);
}

// Returns the single key of a step object, or undefined when the object does
// not have exactly one key.
function getStepKey(step) {
  const keys = Object.keys(step);
  if (keys.length !== 1) {
    return undefined;
  }
  return keys[0];
}

// A step's target is a blockId string or an object that narrows the search:
// `blockId` scopes to the block's #bl- wrapper, `row` and `column` to a grid
// row (zero-based, as displayed) and cell (by col-id) inside it, `text` to the
// interactive control with exactly that text, `nth` picks among several
// matches. `text` alone, with no blockId, searches the whole page — that is
// how portal-rendered controls (confirm dialog buttons, modal footers,
// dropdown menu items) are reached, since they render outside every block.
const TARGET_KEYS = ['blockId', 'text', 'row', 'column', 'nth'];

function isIndex(value) {
  return type.isInt(value) && value >= 0;
}

// Validates the target keys of a step object; `extraKeys` are the step's own
// keys (`value`, `contains`) that may sit beside them. Returns an error
// message, or undefined when the target is well-formed.
function validateTargetObject({ key, params, extraKeys = [], requireBlockId = false }) {
  const allowed = [...TARGET_KEYS, ...extraKeys];
  const unknown = Object.keys(params).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    return `Step "${key}" has unknown key${unknown.length > 1 ? 's' : ''} ${unknown
      .map((k) => `"${k}"`)
      .join(', ')}. Keys are: ${allowed.join(', ')}.`;
  }
  if (!type.isUndefined(params.blockId) && !type.isString(params.blockId)) {
    return `Step "${key}" requires "blockId" to be a string. Received ${describe(params.blockId)}.`;
  }
  if (!type.isUndefined(params.text) && !type.isString(params.text)) {
    return `Step "${key}" requires "text" to be a string. Received ${describe(params.text)}.`;
  }
  if (requireBlockId && type.isUndefined(params.blockId)) {
    return `Step "${key}" requires a "blockId" string. Received ${describe(params)}.`;
  }
  if (type.isUndefined(params.blockId) && type.isUndefined(params.text)) {
    return `Step "${key}" requires a "blockId" or a "text" to target. Received ${describe(
      params
    )}.`;
  }
  if (!type.isUndefined(params.row) && !isIndex(params.row)) {
    return `Step "${key}" requires "row" to be a zero-based row index. Received ${describe(
      params.row
    )}.`;
  }
  if (!type.isUndefined(params.column) && !type.isString(params.column)) {
    return `Step "${key}" requires "column" to be a column id string. Received ${describe(
      params.column
    )}.`;
  }
  if (
    (!type.isUndefined(params.row) || !type.isUndefined(params.column)) &&
    type.isUndefined(params.blockId)
  ) {
    return `Step "${key}" requires a "blockId" (the grid block) when "row" or "column" is given. Received ${describe(
      params
    )}.`;
  }
  if (!type.isUndefined(params.nth) && !isIndex(params.nth)) {
    return `Step "${key}" requires "nth" to be a zero-based index. Received ${describe(
      params.nth
    )}.`;
  }
  return undefined;
}

// click and expect.visible take a blockId string or a target object.
function validateTarget({ key, params }) {
  if (type.isString(params)) {
    return undefined;
  }
  if (!type.isObject(params)) {
    return `Step "${key}" requires a blockId string or a target object { blockId, text, row, column, nth }. Received ${describe(
      params
    )}.`;
  }
  return validateTargetObject({ key, params });
}

// fill and select take the target keys beside `value`; the block is required
// because a value is typed into a block's input, never a page-wide control.
function validateBlockValue({ key, params }) {
  if (!type.isObject(params)) {
    return `Step "${key}" requires { blockId, value }. Received ${describe(params)}.`;
  }
  if (type.isUndefined(params.value)) {
    return `Step "${key}" requires a "value". Received ${describe(params)}.`;
  }
  return validateTargetObject({ key, params, extraKeys: ['value'], requireBlockId: true });
}

function validateWait(params) {
  if (!type.isObject(params)) {
    return `Step "wait" requires one of { ms }, { request }, { state }. Received ${describe(
      params
    )}.`;
  }
  const key = getStepKey(params);
  if (!WAIT_KEYS.includes(key)) {
    return `Step "wait" requires exactly one of ${WAIT_KEYS.map((k) => `"${k}"`).join(
      ', '
    )}. Received ${describe(params)}.`;
  }
  if (key === 'ms' && !type.isNumber(params.ms)) {
    return `Step "wait" requires "ms" to be a number. Received ${describe(params.ms)}.`;
  }
  if (key !== 'ms' && !type.isString(params[key])) {
    return `Step "wait" requires "${key}" to be a string. Received ${describe(params[key])}.`;
  }
  return undefined;
}

function validateExpect(params) {
  if (!type.isObject(params)) {
    return `Step "expect" requires one of { state }, { visible }, { text }, { url }. Received ${describe(
      params
    )}.`;
  }
  const key = getStepKey(params);
  if (!EXPECT_KEYS.includes(key)) {
    return `Step "expect" requires exactly one of ${EXPECT_KEYS.map((k) => `"${k}"`).join(
      ', '
    )}. Received ${describe(params)}.`;
  }
  const value = params[key];
  switch (key) {
    case 'state':
      if (!type.isObject(value) || !type.isString(value.path) || !('equals' in value)) {
        return `Step "expect.state" requires { path, equals }. Received ${describe(value)}.`;
      }
      return undefined;
    case 'visible':
      return validateTarget({ key: 'expect.visible', params: value });
    case 'text':
      if (!type.isObject(value) || !type.isString(value.contains)) {
        return `Step "expect.text" requires { blockId, contains }. Received ${describe(value)}.`;
      }
      return validateTargetObject({
        key: 'expect.text',
        params: value,
        extraKeys: ['contains'],
        requireBlockId: true,
      });
    case 'url':
      if (!type.isObject(value) || !type.isString(value.contains)) {
        return `Step "expect.url" requires { contains }. Received ${describe(value)}.`;
      }
      return undefined;
    default:
      return undefined;
  }
}

// Validates one step's shape. Returns an error message, or undefined when the
// step is well-formed.
function validateStep(step) {
  if (!type.isObject(step)) {
    return `Journey steps must be objects with one key. Received ${describe(step)}.`;
  }
  const key = getStepKey(step);
  if (type.isUndefined(key) || !STEP_KEYS.includes(key)) {
    const received = type.isUndefined(key) ? Object.keys(step).join(', ') : key;
    return `Unknown journey step "${received}". Steps are: ${STEP_KEYS.join(', ')}.`;
  }
  const params = step[key];
  switch (key) {
    case 'click':
      return validateTarget({ key: 'click', params });
    case 'fill':
    case 'select':
      return validateBlockValue({ key, params });
    case 'press':
      if (!type.isString(params)) {
        return `Step "press" requires a key string such as "Enter" or "Mod+k". Received ${describe(
          params
        )}.`;
      }
      return undefined;
    case 'wait':
      return validateWait(params);
    case 'screenshot':
      if (!type.isNone(params) && !type.isString(params) && params !== true) {
        return `Step "screenshot" takes an optional name string. Received ${describe(params)}.`;
      }
      return undefined;
    case 'expect':
      return validateExpect(params);
    default:
      return undefined;
  }
}

// Checks the whole journey before a browser is opened, so an agent gets a
// grammar mistake back in milliseconds instead of after a page load. Returns
// { error } naming the offending step, or {} when every step is well-formed.
function validateJourneySteps({ steps }) {
  if (!type.isArray(steps)) {
    return { error: `runJourney requires "steps" to be an array. Received ${describe(steps)}.` };
  }
  for (let index = 0; index < steps.length; index += 1) {
    const message = validateStep(steps[index]);
    if (!type.isUndefined(message)) {
      return { error: `Step ${index}: ${message}` };
    }
  }
  return {};
}

export { STEP_KEYS, TARGET_KEYS, getStepKey };
export default validateJourneySteps;
