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

import generateKinds from './generateKinds.js';

const markerKeys = ['~d', '_oid'];

// A date-only ISO string is UTC and a date-time names its offset, so a bound means the same instant
// on every machine. Date.parse reads a date-time without an offset (or any other format) in the
// machine's time zone, which would make generated dates differ between machines.
const dateBoundPattern =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;

function parseDateBound({ value, where, fail }) {
  const ms = type.isString(value) && dateBoundPattern.test(value) ? Date.parse(value) : NaN;
  if (Number.isNaN(ms)) {
    fail(
      `${where} should be a date such as 2026-01-31, or a date-time with its offset such as 2026-01-31T09:00:00Z. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  return ms;
}

function validateOneOf({ spec, where, fail }) {
  if (!type.isArray(spec.oneOf) || spec.oneOf.length === 0) {
    fail(`${where}.oneOf should be a list of values to pick from.`);
  }
  if (type.isUndefined(spec.weights)) {
    return { kind: 'oneOf', values: spec.oneOf, weights: spec.oneOf.map(() => 1) };
  }
  if (
    !type.isArray(spec.weights) ||
    spec.weights.length !== spec.oneOf.length ||
    !spec.weights.every((weight) => type.isNumber(weight) && weight >= 0) ||
    spec.weights.every((weight) => weight === 0)
  ) {
    fail(
      `${where}.weights should be one number of 0 or more per oneOf value, not all 0. Received ${JSON.stringify(
        spec.weights
      )}.`
    );
  }
  return { kind: 'oneOf', values: spec.oneOf, weights: spec.weights };
}

function validateNumber({ options, where, fail }) {
  if (!type.isObject(options) || !type.isNumber(options.min) || !type.isNumber(options.max)) {
    fail(`${where}.number should be { min, max, decimals? }.`);
  }
  if (options.min > options.max) {
    fail(`${where}.number min ${options.min} is above max ${options.max}.`);
  }
  const decimals = options.decimals ?? 0;
  if (!type.isInt(decimals) || decimals < 0 || decimals > 10) {
    fail(`${where}.number.decimals should be a whole number from 0 to 10.`);
  }
  return { kind: 'number', min: options.min, max: options.max, decimals };
}

function validateDate({ options, where, fail }) {
  if (!type.isObject(options)) {
    fail(`${where}.date should be { from, to }.`);
  }
  const from = parseDateBound({ value: options.from, where: `${where}.date.from`, fail });
  const to = parseDateBound({ value: options.to, where: `${where}.date.to`, fail });
  if (from > to) {
    fail(`${where}.date.from is after date.to.`);
  }
  return { kind: 'date', from, to };
}

function validateText({ options, where, fail }) {
  const words = options?.words;
  if (
    !type.isObject(options) ||
    !type.isArray(words) ||
    words.length !== 2 ||
    !words.every((count) => type.isInt(count) && count >= 1) ||
    words[0] > words[1]
  ) {
    fail(`${where}.text should be { words: [min, max] }, two whole numbers from 1 up.`);
  }
  return { kind: 'text', minWords: words[0], maxWords: words[1] };
}

function validateSequence({ options, where, fail }) {
  if (options === true) {
    return { kind: 'sequence', prefix: null, start: 1 };
  }
  if (
    !type.isObject(options) ||
    (!type.isUndefined(options.prefix) && !type.isString(options.prefix)) ||
    (!type.isUndefined(options.start) && !type.isInt(options.start))
  ) {
    fail(`${where}.sequence should be true or { prefix?, start? }.`);
  }
  return { kind: 'sequence', prefix: options.prefix ?? null, start: options.start ?? 1 };
}

// One generate field, checked and normalised to { kind, ...options } so generation reads no raw
// YAML. A value that is not an object (or is a { "~d" } date or { _oid } ObjectId marker) is a
// literal; an object names exactly one kind.
function validateGenerateField({ spec, where, fail }) {
  if (!type.isObject(spec)) {
    return { kind: 'literal', value: spec };
  }
  const keys = Object.keys(spec);
  if (keys.length === 1 && markerKeys.includes(keys[0])) {
    return { kind: 'literal', value: spec };
  }
  const kinds = keys.filter((key) => generateKinds.includes(key));
  keys.forEach((key) => {
    if (generateKinds.includes(key) || (key === 'weights' && kinds[0] === 'oneOf')) return;
    fail(
      `${where} has unknown kind "${key}". Kinds: ${generateKinds.join(
        ', '
      )}. Write an object value as { literal: <value> }.`
    );
  });
  if (kinds.length !== 1) {
    fail(`${where} names ${kinds.length} kinds (${kinds.join(', ')}); a field takes one.`);
  }
  const [kind] = kinds;
  const options = spec[kind];
  switch (kind) {
    case 'literal':
      return { kind, value: options };
    case 'oneOf':
      return validateOneOf({ spec, where, fail });
    case 'number':
      return validateNumber({ options, where, fail });
    case 'date':
      return validateDate({ options, where, fail });
    case 'text':
      return validateText({ options, where, fail });
    case 'sequence':
      return validateSequence({ options, where, fail });
    case 'ref':
      if (!type.isString(options)) {
        fail(`${where}.ref should name a connection id in fixtures or generate.`);
      }
      return { kind, connectionId: options };
    default:
      if (options !== true) {
        fail(`${where}.${kind} should be true.`);
      }
      return { kind };
  }
}

export default validateGenerateField;
