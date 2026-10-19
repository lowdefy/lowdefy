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
  expect(() => _type({ params: null, location })).toThrow('_type.type must be a string.');
});
test('_type with non-string on', () => {
  expect(_type({ params: { type: 'number', on: 5 }, location })).toEqual(true);
});
test('_type with unknown type', () => {
  expect(() => _type({ params: { type: 'strings' }, location })).toThrow(
    '"strings" is not a valid _type test.'
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

test("_type empty is true for null, undefined, '' and []", () => {
  expect(_type({ params: { type: 'empty', on: null }, location, state })).toEqual(true);
  expect(_type({ params: { type: 'empty', on: undefined }, location, state })).toEqual(true);
  expect(_type({ params: { type: 'empty', on: '' }, location, state })).toEqual(true);
  expect(_type({ params: { type: 'empty', on: [] }, location, state })).toEqual(true);
});
test("_type empty is false for 0, false, {}, ' ', [null] and a Date", () => {
  expect(_type({ params: { type: 'empty', on: 0 }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', on: false }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', on: {} }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', on: ' ' }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', on: [null] }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', on: new Date(0) }, location, state })).toEqual(false);
});
test('_type empty reads the state value at the operator location when no key or on is given', () => {
  expect(_type({ params: { type: 'empty' }, location: 'string', state })).toEqual(false);
  expect(_type({ params: { type: 'empty' }, location: 'notThere', state })).toEqual(true);
  expect(
    _type({ params: { type: 'empty' }, location: 'emptyString', state: { emptyString: '' } })
  ).toEqual(true);
  expect(
    _type({ params: { type: 'empty' }, location: 'emptyArray', state: { emptyArray: [] } })
  ).toEqual(true);
});
test('_type empty with key', () => {
  expect(_type({ params: { type: 'empty', key: 'arr.0.a' }, location, state })).toEqual(false);
  expect(_type({ params: { type: 'empty', key: 'notThere' }, location, state })).toEqual(true);
});

test('_type with a reserved key returns false and does not throw', () => {
  expect(_type({ params: { type: 'string', key: '__proto__' }, location, state })).toEqual(false);
});
test('_type undefined with a reserved key returns true and does not throw', () => {
  expect(_type({ params: { type: 'undefined', key: '__proto__' }, location, state })).toEqual(true);
});
test('_type with a reserved location returns false and does not throw', () => {
  expect(_type({ params: { type: 'string' }, location: 'a.constructor.b', state })).toEqual(false);
});
test('_type propagates an error that is not a ReservedKeyError', () => {
  const throwingState = {};
  Object.defineProperty(throwingState, 'boom', {
    enumerable: true,
    get: () => {
      throw new Error('read failed');
    },
  });
  expect(() =>
    _type({ params: { type: 'string', key: 'boom' }, location, state: throwingState })
  ).toThrow('read failed');
});

test('_type date with on packed date pass and calls ServerParser', () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const res = parser.parse({ input, location, payload: {} });
  expect(res.output).toEqual(true);
});
