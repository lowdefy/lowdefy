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

import { serializer } from '@lowdefy/helpers';

import findOperatorInData from './findOperatorInData.js';

test('findOperatorInData returns null for data without operators', () => {
  expect(findOperatorInData({ a: [1, 'two', { b: null }], _id: 'x' })).toBe(null);
  expect(findOperatorInData('text')).toBe(null);
  expect(findOperatorInData({ _a: 1, b: 2 })).toBe(null);
});

test('findOperatorInData finds the operator and its path', () => {
  expect(findOperatorInData({ rows: [{ title: { _global: 'token' } }] })).toEqual({
    operator: '_global',
    path: 'rows.0.title',
  });
});

test('findOperatorInData normalises escaped operators and methods', () => {
  expect(findOperatorInData([{ '___string.concat': [] }])).toEqual({
    operator: '_string',
    path: '0',
  });
});

test('findOperatorInData reports an empty path when the value itself is an operator', () => {
  expect(findOperatorInData({ _request: 'x' })).toEqual({ operator: '_request', path: '' });
});

test('findOperatorInData finds an operator beside keys the client never receives', () => {
  expect(findOperatorInData({ rows: [{ _request: 'secret', note: undefined }] })).toEqual({
    operator: '_request',
    path: 'rows.0',
  });
  expect(findOperatorInData(JSON.parse('[{ "_user": "email", "__proto__": {} }]'))).toEqual({
    operator: '_user',
    path: '0',
  });
});

test('findOperatorInData finds an operator inside an error, as the page sends it', () => {
  const error = serializer.deserialize({ '~e': { name: 'Error', message: { _request: 'x' } } });
  expect(findOperatorInData({ html: error })).toEqual({
    operator: '_request',
    path: 'html.~e.message',
  });
});
