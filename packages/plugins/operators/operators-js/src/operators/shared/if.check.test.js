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

import checks from '../../checks.js';
import ifTest from './if.check.js';

const check = (params) =>
  ifTest.check({ params, node: { _if: params }, type: '_if', kind: 'operators' });

test('checks export registers if-test for _if', () => {
  expect(checks).toEqual({ operators: { _if: [ifTest] } });
  expect(ifTest.id).toBe('if-test');
  expect(ifTest.level).toBe('error');
  expect(ifTest.description).toBe('_if needs its condition under test.');
});

test('condition outside test fires', () => {
  expect(check({ _eq: [1, 1], then: 'a', else: 'b' })).toBe(
    '_if has no test key. Put the condition under test:.'
  );
});

test('then and else without test fires', () => {
  expect(check({ then: 'a', else: 'b' })).toBe(
    '_if has no test key. Put the condition under test:.'
  );
});

test('empty object fires', () => {
  expect(check({})).toBe('_if has no test key. Put the condition under test:.');
});

test('test, then and else passes', () => {
  expect(check({ test: { _eq: [1, 1] }, then: 'a', else: 'b' })).toBe(null);
  expect(check({ test: true, then: 'a', else: 'b' })).toBe(null);
});

test('test key with an undefined or null value passes', () => {
  expect(check({ test: null, then: 'a', else: 'b' })).toBe(null);
  expect(check({ test: undefined, then: 'a', else: 'b' })).toBe(null);
});

test('params that are one operator pass', () => {
  expect(check({ _state: 'ifParams' })).toBe(null);
  expect(check({ '_get.from': {} })).toBe(null);
  expect(check({ _state: 'ifParams', '~k': 'k1', '~r': 'r1' })).toBe(null);
});

test('array and primitive params pass', () => {
  expect(check([true, 'a', 'b'])).toBe(null);
  expect(check(true)).toBe(null);
  expect(check('a')).toBe(null);
  expect(check(1)).toBe(null);
  expect(check(null)).toBe(null);
  expect(check(undefined)).toBe(null);
});

test('~ keys alone do not look like an operator', () => {
  expect(check({ '~k': 'k1' })).toBe('_if has no test key. Put the condition under test:.');
  expect(check({ '~k': 'k1', '~r': 'r1', '~l': 3 })).toBe(
    '_if has no test key. Put the condition under test:.'
  );
});

test('~ keys do not hide a missing test', () => {
  expect(check({ '~k': 'k1', _eq: [1, 1], then: 'a', else: 'b' })).toBe(
    '_if has no test key. Put the condition under test:.'
  );
  expect(check({ '~k': 'k1', then: 'a' })).toBe(
    '_if has no test key. Put the condition under test:.'
  );
});

test('~ keys beside test pass', () => {
  expect(check({ '~k': 'k1', test: true, then: 'a', else: 'b' })).toBe(null);
});

test('_id is not an operator', () => {
  expect(check({ _id: 'x' })).toBe('_if has no test key. Put the condition under test:.');
});
