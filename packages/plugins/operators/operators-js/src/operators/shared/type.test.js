/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { NodeParser } from '@lowdefy/operators';
import _type from './type.js';
import _date from './date.js';

const operators = {
  _date,
  _type,
};

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
  boolean: true,
};

test('_type with on, pass', () => {
  expect(_type({ params: { type: 'string', on: 'a' } })).toEqual(true);
});
test('_type with on, fail', () => {
  expect(_type({ params: { type: 'number', on: 'a' } })).toEqual(false);
});
test('_type with key, pass', () => {
  expect(_type({ params: { type: 'string', key: 'string' }, state })).toEqual(true);
});
test('_type with key, fail', () => {
  expect(_type({ params: { type: 'string', key: 'number' }, state })).toEqual(false);
});
test('_type with null on, pass', () => {
  expect(_type({ params: { type: 'null', on: null } })).toEqual(true);
});
test('_type with null on, fail', () => {
  expect(_type({ params: { type: 'boolean', on: null } })).toEqual(false);
});
test('_type with nonexistent key', () => {
  expect(_type({ params: { type: 'boolean', key: 'notThere' }, state })).toEqual(false);
});
test('_type with null key', () => {
  expect(_type({ params: { type: 'boolean', key: null }, state })).toEqual(false);
});
test('_type null', () => {
  expect(() => _type({ params: null })).toThrow('_type.type must be a string.');
});
test('_type with non-string on', () => {
  expect(_type({ params: { type: 'number', on: 5 } })).toEqual(true);
});
test('_type with unknown type', () => {
  expect(() => _type({ params: { type: 'strings' } })).toThrow(
    '"strings" is not a valid _type test.'
  );
});
test('_type date on string date fail', () => {
  expect(_type({ params: { type: 'date', on: '2019-11-28T08:10:09.844Z' } })).toEqual(false);
});
test('_type date on date object pass', () => {
  expect(_type({ params: { type: 'date', on: new Date() } })).toEqual(true);
});

test('_type array', () => {
  expect(_type({ params: { type: 'array', key: 'arr' }, state })).toEqual(true);
});
test('_type object', () => {
  expect(_type({ params: { type: 'object', on: { key: 'value' } }, state })).toEqual(true);
});
test('_type primitive', () => {
  expect(_type({ params: { type: 'primitive', on: 'Primitive string' }, state })).toEqual(true);
});
test('_type integer', () => {
  expect(_type({ params: { type: 'integer', on: 42 }, state })).toEqual(true);
});
test('_type undefined', () => {
  expect(_type({ params: { type: 'undefined', on: undefined }, state })).toEqual(true);
});
test('_type none', () => {
  expect(_type({ params: { type: 'none' }, state })).toEqual(true);
});

test('_type date with on packed date pass and calls NodeParser', () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new NodeParser({ operators, payload: {}, secrets: {}, user: {} });
  const res = parser.parse({ input });
  expect(res).toEqual(true);
});
