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

function isSchemaExpectation(expected) {
  return type.isObject(expected) && Object.keys(expected).length === 1 && 'schema' in expected;
}

// Compares a response against a test's `expect`: { schema } validates with ajv,
// anything else is a literal subset. The result names the exact path of the
// first mismatch so a failure reads as "response.0.status expected open, got closed".
function matchExpectation({ expected, actual }) {
  if (isSchemaExpectation(expected)) {
    return matchSchema({ schema: expected.schema, actual });
  }
  return matchSubset({ expected, actual, path: '' });
}

export default matchExpectation;
