/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { ServerParser } from '@lowdefy/operators';
import _type from './type.js';
import _date from './date.js';

const operators = {
  _date,
  _type,
};

const location = 'location';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
  boolean: true,
};

console.error = () => {};

test('_type with on, pass', () => {
  expect(_type({ params: { type: 'string', on: 'a' }, location })).toEqual(true);
});
test('_type with on, fail', () => {
  expect(_type({ params: { type: 'number', on: 'a' }, location })).toEqual(false);
});
test('_type with key, pass', () => {
  expect(_type({ params: { type: 'string', key: 'string' }, location, state })).toEqual(true);
});
test('_type with key, fail', () => {
  expect(_type({ params: { type: 'string', key: 'number' }, location, state })).toEqual(false);
});
test('_type with null on, pass', () => {
  expect(_type({ params: { type: 'null', on: null }, location })).toEqual(true);
});
test('_type with null on, fail', () => {
  expect(_type({ params: { type: 'boolean', on: null }, location })).toEqual(false);
});
test('_type with nonexistent key', () => {
  expect(_type({ params: { type: 'boolean', key: 'notThere' }, location, state })).toEqual(false);
});
test('_type with null key', () => {
  expect(_type({ params: { type: 'boolean', key: null }, location, state })).toEqual(false);
});
test('_type null', () => {
  expect(() => _type({ params: null, location })).toThrow(
    'Operator Error: _type.type must be a string. Received: null at location.'
  );
});
test('_type with non-string on', () => {
  expect(_type({ params: { type: 'number', on: 5 }, location })).toEqual(true);
});
test('_type with unknown type', () => {
  expect(() => _type({ params: { type: 'strings' }, location })).toThrow(
    'Operator Error: "strings" is not a valid _type test. Received: {"type":"strings"} at location.'
  );
});
test('_type date on string date fail', () => {
  expect(_type({ params: { type: 'date', on: '2019-11-28T08:10:09.844Z' }, location })).toEqual(
    false
  );
});
test('_type date on date object pass', () => {
  expect(_type({ params: { type: 'date', on: new Date() }, location })).toEqual(true);
});

test('_type array', () => {
  expect(_type({ params: { type: 'array', key: 'arr' }, location, state })).toEqual(true);
});
test('_type object', () => {
  expect(_type({ params: { type: 'object', on: { key: 'value' } }, location, state })).toEqual(
    true
  );
});
test('_type primitive', () => {
  expect(_type({ params: { type: 'primitive', on: 'Primitive string' }, location, state })).toEqual(
    true
  );
});
test('_type integer', () => {
  expect(_type({ params: { type: 'integer', on: 42 }, location, state })).toEqual(true);
});
test('_type undefined', () => {
  expect(_type({ params: { type: 'undefined', on: undefined }, location, state })).toEqual(true);
});
test('_type none', () => {
  expect(_type({ params: { type: 'none' }, location, state })).toEqual(true);
});

test('_type date with on packed date pass and calls ServerParser', () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new ServerParser({ operators, payload: {}, secrets: {}, user: {} });
  const res = parser.parse({ input, location });
  expect(res.output).toEqual(true);
});
