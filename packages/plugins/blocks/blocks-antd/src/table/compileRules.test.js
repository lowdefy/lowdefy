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

import compileRules from './compileRules.js';

const column = { key: 'score', field: 'score', type: 'number' };

test('compileRules returns null when there are no rules', () => {
  expect(compileRules({ rules: [], column })).toBeNull();
  expect(compileRules({ rules: undefined, column })).toBeNull();
});

test('compileRules maps status colours to text tokens and keeps other colours', () => {
  const apply = compileRules({
    rules: [
      { when: { op: 'gte', value: 8 }, color: 'success' },
      { when: { op: 'lt', value: 5 }, color: '#f00' },
    ],
    column,
  });
  expect(apply({}, 9)).toEqual({
    className: undefined,
    style: { color: 'var(--ant-color-success-text, var(--ant-color-success))' },
  });
  expect(apply({}, 2)).toEqual({ className: undefined, style: { color: '#f00' } });
  expect(apply({}, 6)).toBeNull();
});

test('compileRules applies every matching rule in order', () => {
  const apply = compileRules({
    rules: [
      { when: { op: 'gt', value: 0 }, className: 'a', style: { fontWeight: 600, color: 'red' } },
      { when: { op: 'gt', value: 5 }, className: 'b', color: 'blue' },
      { className: 'always' },
    ],
    column,
  });
  expect(apply({}, 7)).toEqual({
    className: 'a b always',
    style: { fontWeight: 600, color: 'var(--ant-blue-6, #1677ff)' },
  });
  expect(apply({}, 1)).toEqual({ className: 'a always', style: { fontWeight: 600, color: 'red' } });
});

test('compileRules row rules read other fields by key', () => {
  const apply = compileRules({
    rules: [{ when: { key: 'overdue', op: 'isTrue' }, className: 'lf-row-warning' }],
  });
  expect(apply({ overdue: true })).toEqual({ className: 'lf-row-warning', style: undefined });
  expect(apply({ overdue: false })).toBeNull();
});

test('compileRules throws on a rule that is not an object', () => {
  expect(() => compileRules({ rules: ['red'], column })).toThrow(
    'Table rule must be an object. Received "red".'
  );
});
