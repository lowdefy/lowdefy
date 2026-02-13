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

import extractOperatorKey from './extractOperatorKey.js';

test('extractOperatorKey with simple string', () => {
  const result = extractOperatorKey({ operatorValue: 'userName' });
  expect(result).toBe('userName');
});

test('extractOperatorKey with dot notation string', () => {
  const result = extractOperatorKey({ operatorValue: 'user.name' });
  expect(result).toBe('user');
});

test('extractOperatorKey with deep dot notation', () => {
  const result = extractOperatorKey({ operatorValue: 'user.profile.firstName' });
  expect(result).toBe('user');
});

test('extractOperatorKey with array index notation', () => {
  const result = extractOperatorKey({ operatorValue: 'users[0].name' });
  expect(result).toBe('users');
});

test('extractOperatorKey with mixed notation', () => {
  const result = extractOperatorKey({ operatorValue: 'data[0].items[1].value' });
  expect(result).toBe('data');
});

test('extractOperatorKey with object containing key property', () => {
  const result = extractOperatorKey({ operatorValue: { key: 'user.name' } });
  expect(result).toBe('user');
});

test('extractOperatorKey with object containing path property', () => {
  const result = extractOperatorKey({ operatorValue: { path: 'items[0].value' } });
  expect(result).toBe('items');
});

test('extractOperatorKey with object key takes precedence over path', () => {
  const result = extractOperatorKey({ operatorValue: { key: 'keyValue', path: 'pathValue' } });
  expect(result).toBe('keyValue');
});

test('extractOperatorKey with null returns null', () => {
  const result = extractOperatorKey({ operatorValue: null });
  expect(result).toBe(null);
});

test('extractOperatorKey with undefined returns null', () => {
  const result = extractOperatorKey({ operatorValue: undefined });
  expect(result).toBe(null);
});

test('extractOperatorKey with empty string returns null', () => {
  const result = extractOperatorKey({ operatorValue: '' });
  expect(result).toBe(null);
});

test('extractOperatorKey with number returns null', () => {
  const result = extractOperatorKey({ operatorValue: 123 });
  expect(result).toBe(null);
});

test('extractOperatorKey with boolean returns null', () => {
  const result = extractOperatorKey({ operatorValue: true });
  expect(result).toBe(null);
});

test('extractOperatorKey with array returns null', () => {
  const result = extractOperatorKey({ operatorValue: ['user', 'name'] });
  expect(result).toBe(null);
});

test('extractOperatorKey with empty object returns null', () => {
  const result = extractOperatorKey({ operatorValue: {} });
  expect(result).toBe(null);
});

test('extractOperatorKey with object containing other properties returns null', () => {
  const result = extractOperatorKey({ operatorValue: { default: 'value' } });
  expect(result).toBe(null);
});

test('extractOperatorKey with starts with dot returns null', () => {
  const result = extractOperatorKey({ operatorValue: '.invalid' });
  expect(result).toBe(null);
});

test('extractOperatorKey with starts with bracket returns null', () => {
  const result = extractOperatorKey({ operatorValue: '[0].value' });
  expect(result).toBe(null);
});
