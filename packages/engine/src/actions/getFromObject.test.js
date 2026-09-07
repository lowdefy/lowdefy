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

import { jest } from '@jest/globals';

import getFromObject from './getFromObject.js';

const location = 'location';
const method = 'method';
const arrayIndices = [];
const object = { string: 'string', obj: { key: 'value' } };

test('get a field from an object, shorthand', () => {
  expect(getFromObject({ params: 'string', object, arrayIndices, method, location })).toEqual(
    'string'
  );
});

test('get a field from an object, key as param', () => {
  expect(
    getFromObject({ params: { key: 'string' }, object, arrayIndices, method, location })
  ).toEqual('string');
});

test('get the entire object when params is true', () => {
  const res = getFromObject({ params: true, object, arrayIndices, method, location });
  expect(res).toEqual(object);
  expect(res).not.toBe(object);
});

test('missing path returns null when no default is given', () => {
  expect(
    getFromObject({ params: { key: 'not_there' }, object, arrayIndices, method, location })
  ).toEqual(null);
});

test('missing path returns the default', () => {
  expect(
    getFromObject({
      params: { key: 'not_there', default: 'default' },
      object,
      arrayIndices,
      method,
      location,
    })
  ).toEqual('default');
});

test('key null returns the default', () => {
  expect(
    getFromObject({
      params: { key: null, default: 'default' },
      object,
      arrayIndices,
      method,
      location,
    })
  ).toEqual('default');
});

test('params not correct type throws', () => {
  expect(() => getFromObject({ params: [], object, arrayIndices, method, location })).toThrow(
    'Method Error: method params must be of type string, integer, boolean or object at location.'
  );
});

test('params key not a string throws', () => {
  expect(() =>
    getFromObject({ params: { key: {} }, object, arrayIndices, method, location })
  ).toThrow('Method Error: method params.key must be of type string or integer at location.');
});

test('reserved key as the whole key returns null when no default is given', () => {
  expect(
    getFromObject({ params: { key: '__proto__' }, object, arrayIndices, method, location })
  ).toEqual(null);
});

test('reserved key as the whole key returns the default', () => {
  expect(
    getFromObject({
      params: { key: '__proto__', default: 'default' },
      object,
      arrayIndices,
      method,
      location,
    })
  ).toEqual('default');
});

test('reserved key in the middle of the path returns the default', () => {
  expect(
    getFromObject({
      params: { key: 'a.__proto__.b', default: 'default' },
      object: { a: { b: 1 } },
      arrayIndices,
      method,
      location,
    })
  ).toEqual('default');
});

test('reserved key as shorthand params returns null', () => {
  expect(getFromObject({ params: 'constructor', object, arrayIndices, method, location })).toEqual(
    null
  );
});

test('reserved key does not log a warning or error', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  getFromObject({ params: { key: '__proto__' }, object, arrayIndices, method, location });
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  warn.mockRestore();
  error.mockRestore();
});

test('a nested non-reserved path still resolves', () => {
  expect(
    getFromObject({
      params: { key: 'a.b' },
      object: { a: { b: 1 } },
      arrayIndices,
      method,
      location,
    })
  ).toEqual(1);
});
