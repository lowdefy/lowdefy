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
import { REJECT_KEYS, REQUEST_EXPECT_MARKERS, REQUEST_TEST_KEYS } from './journeyGrammarKeys.js';

function invalid(message) {
  return { valid: false, message };
}

// A page request is addressed by pageId + requestId, an Api endpoint routine by
// endpointId, and a test names exactly one of the two — the bodies of
// POST /lowdefy-docs/run-request and /run-endpoint.
function validateTarget({ test }) {
  const hasPage = !type.isUndefined(test.pageId) || !type.isUndefined(test.requestId);
  const hasEndpoint = !type.isUndefined(test.endpointId);
  if (hasEndpoint && !hasPage) {
    return undefined;
  }
  if (type.isString(test.pageId) && type.isString(test.requestId) && !hasEndpoint) {
    return undefined;
  }
  return 'Request test should name exactly one target: "pageId" together with "requestId" for a page request, or "endpointId" for an Api endpoint routine.';
}

function validateSeed({ seed }) {
  if (!type.isObject(seed)) {
    return `Request test "seed" should be an object keyed by connectionId. Received ${describeValue(
      seed
    )}.`;
  }
  for (const [connectionId, documents] of Object.entries(seed)) {
    if (!type.isArray(documents)) {
      return `Request test "seed" should map each connectionId to an array of documents. Received ${describeValue(
        { [connectionId]: documents }
      )}.`;
    }
    if (!documents.every((document) => type.isObject(document))) {
      return `Request test "seed" documents should be objects. Received ${describeValue(
        documents
      )}.`;
    }
  }
  return undefined;
}

// `expect` is otherwise free-form data (a literal subset of the response), so
// only the reserved assertion forms are checked.
function validateExpect({ expected }) {
  const marker = getStepKey(expected);
  if (type.isUndefined(marker) || !REQUEST_EXPECT_MARKERS.includes(marker)) {
    return undefined;
  }
  const value = expected[marker];
  if (marker === 'contains') {
    if (!type.isArray(value)) {
      return `Request test "expect.contains" requires an array of expected elements. Received ${describeValue(
        value
      )}.`;
    }
    return undefined;
  }
  if (marker === 'reject') {
    const named = REJECT_KEYS.filter((key) => !type.isUndefined(value?.[key]));
    const wellFormed =
      type.isObject(value) &&
      named.length > 0 &&
      named.every((key) => type.isString(value[key])) &&
      Object.keys(value).every((key) => REJECT_KEYS.includes(key));
    if (!wellFormed) {
      return `Request test "expect.reject" requires at least one of "messageContains" or "name" as a string. Received ${describeValue(
        value
      )}.`;
    }
    return undefined;
  }
  if (!type.isObject(value)) {
    return `Request test "expect.${marker}" requires a JSON schema object. Received ${describeValue(
      value
    )}.`;
  }
  return undefined;
}

function validateRequestTest({ test }) {
  if (!type.isObject(test)) {
    return invalid(`Request test should be an object. Received ${describeValue(test)}.`);
  }
  const unknown = Object.keys(test).filter((key) => !REQUEST_TEST_KEYS.includes(key));
  if (unknown.length > 0) {
    return invalid(
      `Request test has unknown key "${
        unknown[0]
      }". Request test keys are: ${REQUEST_TEST_KEYS.join(', ')}.`
    );
  }
  if (type.isUndefined(test.name)) {
    return invalid('Request test should have required property "name".');
  }
  if (!type.isString(test.name)) {
    return invalid(`Request test "name" should be a string. Received ${describeValue(test.name)}.`);
  }
  if (type.isUndefined(test.expect)) {
    return invalid('Request test should have required property "expect".');
  }
  const targetError = validateTarget({ test });
  if (!type.isUndefined(targetError)) {
    return invalid(targetError);
  }
  if (!type.isUndefined(test.user) && !type.isString(test.user) && !type.isObject(test.user)) {
    return invalid(
      `Request test "user" should be a dev user name (string) or an inline user object. Received ${describeValue(
        test.user
      )}.`
    );
  }
  if (!type.isUndefined(test.payload) && !type.isObject(test.payload)) {
    return invalid(
      `Request test "payload" should be an object. Received ${describeValue(test.payload)}.`
    );
  }
  if (!type.isUndefined(test.fixtures)) {
    if (!type.isArray(test.fixtures) || !test.fixtures.every((name) => type.isString(name))) {
      return invalid(
        `Request test "fixtures" should be a list of fixture names from the fixtures directory. Received ${describeValue(
          test.fixtures
        )}.`
      );
    }
  }
  if (!type.isUndefined(test.seed)) {
    const seedError = validateSeed({ seed: test.seed });
    if (!type.isUndefined(seedError)) {
      return invalid(seedError);
    }
  }
  const expectError = validateExpect({ expected: test.expect });
  if (!type.isUndefined(expectError)) {
    return invalid(expectError);
  }
  return { valid: true };
}

export default validateRequestTest;
