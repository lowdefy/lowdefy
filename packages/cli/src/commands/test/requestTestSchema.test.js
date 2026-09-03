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
import validateRequestTest from './validateRequestTest.js';

const minimal = {
  name: 'lists controls',
  pageId: 'controls',
  requestId: 'get_controls',
  expect: [],
};

test('requestTestSchema accepts a minimal page request test', () => {
  expect(validateRequestTest({ test: minimal })).toEqual({ valid: true });
});

test('requestTestSchema accepts an endpoint test with user, payload, seed and a schema expect', () => {
  expect(
    validateRequestTest({
      test: {
        name: 'creates a control',
        endpointId: 'create_control',
        user: 'admin',
        payload: { title: 'Access reviews' },
        seed: { controls: [{ _id: 'c1' }] },
        expect: { schema: { type: 'object' } },
      },
    })
  ).toEqual({ valid: true });
});

test('requestTestSchema rejects pageId without requestId', () => {
  const result = validateRequestTest({ test: { name: 'x', pageId: 'controls', expect: [] } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test should name exactly one target');
});

test('requestTestSchema rejects both endpointId and requestId', () => {
  const result = validateRequestTest({
    test: { ...minimal, endpointId: 'create_control' },
  });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test should name exactly one target');
});

test('requestTestSchema rejects a missing name', () => {
  const { name, ...withoutName } = minimal;
  const result = validateRequestTest({ test: withoutName });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test should have required property "name".');
});

test('requestTestSchema rejects a missing expect', () => {
  const { expect: _, ...withoutExpect } = minimal;
  const result = validateRequestTest({ test: withoutExpect });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test should have required property "expect".');
});

test('requestTestSchema rejects a seed whose value is not an array', () => {
  const result = validateRequestTest({ test: { ...minimal, seed: { controls: { _id: 1 } } } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(
    'Request test "seed" should map each connectionId to an array of documents.'
  );
});

test('requestTestSchema rejects a user that is neither a string nor an object', () => {
  const result = validateRequestTest({ test: { ...minimal, user: 5 } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test "user" should be a dev user name');
});

test('requestTestSchema rejects a non-object test', () => {
  const result = validateRequestTest({ test: 'nope' });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Request test should');
});

test('requestTestSchema accepts a fixtures list of names and rejects other shapes', () => {
  expect(validateRequestTest({ test: { ...minimal, fixtures: ['base', 'org-a'] } })).toEqual({
    valid: true,
  });
  expect(validateRequestTest({ test: { ...minimal, fixtures: 'base' } })).toEqual({
    valid: false,
    message:
      'Request test "fixtures" should be a list of fixture names from the fixtures directory.',
  });
  expect(validateRequestTest({ test: { ...minimal, fixtures: [{ name: 'base' }] } })).toEqual({
    valid: false,
    message: 'Request test "fixtures" entries should be fixture names (strings).',
  });
});
