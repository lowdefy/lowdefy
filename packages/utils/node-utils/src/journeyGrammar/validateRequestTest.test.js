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

import getRejectExpectation from './getRejectExpectation.js';
import validateRequestTest from './validateRequestTest.js';

const minimal = { name: 'get_controls', pageId: 'controls', requestId: 'get_controls', expect: [] };

test('validateRequestTest accepts a minimal page request test', () => {
  expect(validateRequestTest({ test: minimal })).toEqual({ valid: true });
});

test('validateRequestTest accepts an endpoint test with user, payload, seed and a schema expect', () => {
  expect(
    validateRequestTest({
      test: {
        name: 'create_control',
        endpointId: 'create_control',
        user: { sub: 'u1' },
        payload: { title: 'x' },
        seed: { controls: [{ _id: 'c1' }] },
        expect: { schema: { type: 'object' } },
      },
    })
  ).toEqual({ valid: true });
});

test.each([
  [{ contains: [{ title: 'x' }] }],
  [{ '~schema': { type: 'array' } }],
  [{ reject: { messageContains: 'not authorized' } }],
  [{ reject: { name: 'RequestError' } }],
  [{ reject: { name: 'RequestError', messageContains: 'not authorized' } }],
])('validateRequestTest accepts the reserved expect form %j', (expected) => {
  expect(validateRequestTest({ test: { ...minimal, expect: expected } })).toEqual({ valid: true });
});

test.each([
  ['nope', 'Request test should be an object. Received "nope".'],
  [
    { ...minimal, pageID: 'controls' },
    'Request test has unknown key "pageID". Request test keys are: endpointId, expect, fixtures, name, pageId, payload, requestId, seed, user.',
  ],
  [
    { pageId: 'controls', requestId: 'r', expect: [] },
    'Request test should have required property "name".',
  ],
  [
    { name: 'x', pageId: 'controls', requestId: 'r' },
    'Request test should have required property "expect".',
  ],
  [
    { name: 'x', pageId: 'controls', expect: [] },
    'Request test should name exactly one target: "pageId" together with "requestId" for a page request, or "endpointId" for an Api endpoint routine.',
  ],
  [
    { name: 'x', endpointId: 'e', requestId: 'r', expect: [] },
    'Request test should name exactly one target: "pageId" together with "requestId" for a page request, or "endpointId" for an Api endpoint routine.',
  ],
  [
    { ...minimal, user: 5 },
    'Request test "user" should be a dev user name (string) or an inline user object. Received 5.',
  ],
  [{ ...minimal, payload: 'x' }, 'Request test "payload" should be an object. Received "x".'],
  [
    { ...minimal, fixtures: 'base' },
    'Request test "fixtures" should be a list of fixture names from the fixtures directory. Received "base".',
  ],
  [
    { ...minimal, fixtures: [{ name: 'base' }] },
    'Request test "fixtures" should be a list of fixture names from the fixtures directory. Received [{"name":"base"}].',
  ],
  [
    { ...minimal, seed: { controls: { _id: 1 } } },
    'Request test "seed" should map each connectionId to an array of documents. Received {"controls":{"_id":1}}.',
  ],
  [
    { ...minimal, seed: { controls: ['c1'] } },
    'Request test "seed" documents should be objects. Received ["c1"].',
  ],
  [
    { ...minimal, expect: { contains: { title: 'x' } } },
    'Request test "expect.contains" requires an array of expected elements. Received {"title":"x"}.',
  ],
  [
    { ...minimal, expect: { reject: {} } },
    'Request test "expect.reject" requires at least one of "messageContains" or "name" as a string. Received {}.',
  ],
  [
    { ...minimal, expect: { reject: { message: 'x' } } },
    'Request test "expect.reject" requires at least one of "messageContains" or "name" as a string. Received {"message":"x"}.',
  ],
  [
    { ...minimal, expect: { reject: { name: 7 } } },
    'Request test "expect.reject" requires at least one of "messageContains" or "name" as a string. Received {"name":7}.',
  ],
  [
    { ...minimal, expect: { schema: 'object' } },
    'Request test "expect.schema" requires a JSON schema object. Received "object".',
  ],
])('validateRequestTest rejects %j', (test, message) => {
  expect(validateRequestTest({ test })).toEqual({ valid: false, message });
});

test('getRejectExpectation returns the rejection params only for a single-key reject expect', () => {
  expect(getRejectExpectation({ reject: { name: 'RequestError' } })).toEqual({
    name: 'RequestError',
  });
  expect(getRejectExpectation({ reject: { name: 'x' }, status: 'ok' })).toBeUndefined();
  expect(getRejectExpectation({ reject: 'yes' })).toBeUndefined();
  expect(getRejectExpectation([{ title: 'x' }])).toBeUndefined();
  expect(getRejectExpectation(undefined)).toBeUndefined();
});
