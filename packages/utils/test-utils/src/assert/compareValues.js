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

import { isDeepStrictEqual } from 'node:util';

import isMatcher from './isMatcher.js';
import isPlainObject from './isPlainObject.js';

function difference({ actual, expected, path, reason }) {
  return { actual, expected, path, reason };
}

function compareArrays({ actual, expected, partial, path }) {
  if (!Array.isArray(actual)) {
    return difference({ actual, expected, path, reason: 'is not an array' });
  }
  if (actual.length !== expected.length) {
    return difference({
      actual,
      expected,
      path,
      reason: `has ${actual.length} items, expected ${expected.length}`,
    });
  }
  for (let index = 0; index < expected.length; index += 1) {
    const found = compareValues({
      actual: actual[index],
      expected: expected[index],
      partial,
      path: [...path, index],
    });
    if (found !== null) return found;
  }
  return null;
}

function compareObjects({ actual, expected, partial, path }) {
  if (!isPlainObject(actual)) {
    return difference({ actual, expected, path, reason: 'is not an object' });
  }
  for (const key of Object.keys(expected)) {
    if (!Object.hasOwn(actual, key)) {
      // A key expected to be undefined is the same as a key that is not there.
      if (expected[key] === undefined) continue;
      return difference({
        actual: undefined,
        expected: expected[key],
        path: [...path, key],
        reason: 'is missing',
      });
    }
    const found = compareValues({
      actual: actual[key],
      expected: expected[key],
      partial,
      path: [...path, key],
    });
    if (found !== null) return found;
  }
  if (partial) return null;
  const extra = Object.keys(actual).find(
    (key) => !Object.hasOwn(expected, key) && actual[key] !== undefined
  );
  if (extra !== undefined) {
    return difference({
      actual: actual[extra],
      expected: undefined,
      path: [...path, extra],
      reason: 'is not expected',
    });
  }
  return null;
}

// The first place actual differs from expected, as { actual, expected, path, reason }, or null
// when they match. Plain objects and arrays are walked; a matcher in expected decides for
// itself; every other value (a string, a Date, an ObjectId, an Error) must be deeply and
// strictly equal. With `partial`, an object in actual may hold keys expected does not name, at
// every depth; arrays still match item for item.
function compareValues({ actual, expected, partial, path }) {
  if (isMatcher(expected)) {
    const compare = (matcherActual, matcherExpected, { partial: matcherPartial = partial } = {}) =>
      compareValues({
        actual: matcherActual,
        expected: matcherExpected,
        partial: matcherPartial,
        path,
      });
    if (expected.matches(actual, compare)) return null;
    return difference({ actual, expected, path, reason: `is not ${expected.description}` });
  }
  if (Array.isArray(expected)) {
    return compareArrays({ actual, expected, partial, path });
  }
  if (isPlainObject(expected)) {
    return compareObjects({ actual, expected, partial, path });
  }
  if (isDeepStrictEqual(actual, expected)) return null;
  return difference({ actual, expected, path, reason: 'is not equal' });
}

export default compareValues;
