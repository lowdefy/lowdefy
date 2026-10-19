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

import findOperatorInData from './findOperatorInData.js';

test('findOperatorInData returns null for data without operators', () => {
  expect(findOperatorInData({ value: { a: [1, 'two', { b: null }], _id: 'x' } })).toBe(null);
  expect(findOperatorInData({ value: 'text' })).toBe(null);
  expect(findOperatorInData({ value: { _a: 1, b: 2 } })).toBe(null);
});

test('findOperatorInData finds the operator and its path', () => {
  expect(findOperatorInData({ value: { rows: [{ title: { _global: 'token' } }] } })).toEqual({
    operator: '_global',
    path: 'rows.0.title',
  });
});

test('findOperatorInData normalises escaped operators and methods', () => {
  expect(findOperatorInData({ value: [{ '___string.concat': [] }] })).toEqual({
    operator: '_string',
    path: '0',
  });
});

test('findOperatorInData reports an empty path when the value itself is an operator', () => {
  expect(findOperatorInData({ value: { _request: 'x' } })).toEqual({
    operator: '_request',
    path: '',
  });
});

test('findOperatorInData finds an operator beside a __proto__ key parsed from JSON', () => {
  expect(
    findOperatorInData({ value: JSON.parse('[{ "_user": "email", "__proto__": {} }]') })
  ).toEqual({
    operator: '_user',
    path: '0',
  });
});

test('findOperatorInData walks into serialized wrappers', () => {
  expect(
    findOperatorInData({ value: { html: { '~e': { name: 'Error', message: { _request: 'x' } } } } })
  ).toEqual({ operator: '_request', path: 'html.~e.message' });
});

test('findOperatorInData leaves keys that name no client operator as data', () => {
  const operators = new Set(['_request']);
  expect(findOperatorInData({ value: [{ _score: 0.5 }, { __typename: 'x' }], operators })).toBe(
    null
  );
  expect(findOperatorInData({ value: [{ _score: 0.5 }, { _request: 'x' }], operators })).toEqual({
    operator: '_request',
    path: '1',
  });
});

test('findOperatorInData finds an operator whose sibling can vanish on the client', () => {
  expect(findOperatorInData({ value: { a: { _user: 'email', x: { _if: {} } } } })).toEqual({
    operator: '_user',
    path: 'a',
  });
});
