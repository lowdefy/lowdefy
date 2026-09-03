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
import { validate } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';

function isLeafEqual(expected, actual) {
  if (type.isDate(expected) || type.isDate(actual)) {
    return type.isDate(expected) && type.isDate(actual) && expected.getTime() === actual.getTime();
  }
  return expected === actual;
}

function joinPath(path, key) {
  if (path === '') {
    return String(key);
  }
  return `${path}.${key}`;
}

// Literal subset: every key in expected must be present and match in actual,
// extra actual keys are ignored, arrays match element-wise and must be the same
// length. Returns the first mismatch with its path, or { matched: true }.
function matchSubset({ expected, actual, path }) {
  if (type.isArray(expected)) {
    if (!type.isArray(actual)) {
      return { matched: false, path, expected, actual };
    }
    if (expected.length !== actual.length) {
      return {
        matched: false,
        path: joinPath(path, 'length'),
        expected: expected.length,
        actual: actual.length,
      };
    }
    for (let index = 0; index < expected.length; index += 1) {
      const result = matchSubset({
        expected: expected[index],
        actual: actual[index],
        path: joinPath(path, index),
      });
      if (!result.matched) {
        return result;
      }
    }
    return { matched: true };
  }
  if (type.isObject(expected)) {
    if (!type.isObject(actual)) {
      return { matched: false, path, expected, actual };
    }
    for (const key of Object.keys(expected)) {
      if (!Object.prototype.hasOwnProperty.call(actual, key)) {
        return {
          matched: false,
          path: joinPath(path, key),
          expected: expected[key],
          actual: undefined,
        };
      }
      const result = matchSubset({
        expected: expected[key],
        actual: actual[key],
        path: joinPath(path, key),
      });
      if (!result.matched) {
        return result;
      }
    }
    return { matched: true };
  }
  if (!isLeafEqual(expected, actual)) {
    return { matched: false, path, expected, actual };
  }
  return { matched: true };
}

function matchSchema({ schema, actual }) {
  try {
    validate({ schema, data: actual });
  } catch (error) {
    return { matched: false, path: '', expected: schema, actual, message: error.message };
  }
  return { matched: true };
}

// Every element of `contains` must match some element of the response, in any
// order, and the response may hold more. This is the assertion for "the list
// includes the open controls"; a bare array stays exact, including its length,
// because "these are exactly the rows" is the stronger and more common claim.
function matchContains({ expected, actual }) {
  if (!type.isArray(actual)) {
    return { matched: false, path: '', expected, actual };
  }
  for (let index = 0; index < expected.length; index += 1) {
    const found = actual.some(
      (element) => matchSubset({ expected: expected[index], actual: element, path: '' }).matched
    );
    if (!found) {
      return {
        matched: false,
        path: joinPath('contains', index),
        expected: expected[index],
        actual,
      };
    }
  }
  return { matched: true };
}

// A single-key object naming a reserved marker is an assertion form rather than
// data. The collision is the price of the shorthand: a response whose only
// top-level key is literally "schema" or "contains" cannot be asserted as a
// literal subset. "~schema" is the escape hatch — it asserts the same schema
// while leaving a plain { schema: ... } response matchable through it.
// `reject` is the third reserved marker; it is resolved before the request runs
// (runRequestTest), because it asserts a refusal instead of a response.
const markers = {
  contains: (expected, actual) =>
    type.isArray(expected) ? matchContains({ expected, actual }) : null,
  schema: (expected, actual) => matchSchema({ schema: expected, actual }),
  '~schema': (expected, actual) => matchSchema({ schema: expected, actual }),
};

function getMarker(expected) {
  if (!type.isObject(expected) || Object.keys(expected).length !== 1) {
    return null;
  }
  const [key] = Object.keys(expected);
  if (type.isNone(markers[key])) {
    return null;
  }
  return { key, run: markers[key] };
}

// Compares a response against a test's `expect`: { schema } (or { '~schema' })
// validates with ajv, { contains } asserts membership in an array, anything
// else is a literal subset.
// The result names the exact path of the first mismatch so a failure reads as
// "response.0.status expected open, got closed".
function matchExpectation({ expected, actual }) {
  const marker = getMarker(expected);
  if (!type.isNone(marker)) {
    const result = marker.run(expected[marker.key], actual);
    if (!type.isNone(result)) {
      return result;
    }
  }
  return matchSubset({ expected, actual, path: '' });
}

export default matchExpectation;
