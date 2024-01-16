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

import getFromObject from './getFromObject.js';
// eslint-disable-next-line no-unused-vars

const location = 'location';
const operator = '_operator';
const defaultArrayIndices = [];
const defaultObject = { string: 'string', obj: { key: 'value' } };

test('get a field from an object, shorthand', () => {
  const params = 'string';
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual('string');
});

test('get a field from an object, key as param', () => {
  const params = { key: 'string' };
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual('string');
});

test('get a field from an array, integer index, shorthand', () => {
  const params = 1;
  const res = getFromObject({
    params,
    object: [1, 2, 3],
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(2);
});

test('get a field from an array, integer index', () => {
  const params = { key: 1 };
  const res = getFromObject({
    params,
    object: [1, 2, 3],
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(2);
});

test('get a field from an object, shorthand, not found returns null', () => {
  const params = 'not_there';
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(null);
});

test('get a field from an object, key as param, not found returns null', () => {
  const params = { key: 'not_there' };
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(null);
});

test('get from null', () => {
  const params = 'string';
  const res = getFromObject({
    params,
    object: null,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(null);
});

test('If key is null, null is returned', () => {
  const params = { key: null };
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(null);
});

test('If key is null with default, default is returned', () => {
  const params = { key: null, default: 'default' };
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual('default');
});

test('get an entire object, shorthand', () => {
  const params = true;
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject);
});

test('get an entire object, params all', () => {
  const params = { all: true };
  const res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject);
});

test('get an entire object, object is null', () => {
  const params = true;
  const res = getFromObject({
    params,
    object: null,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(null);
});

test('copy results', () => {
  let params = 'obj';
  let res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject.obj);
  expect(res).not.toBe(defaultObject.obj);
  params = { key: 'obj' };
  res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject.obj);
  expect(res).not.toBe(defaultObject.obj);

  params = true;
  res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject);
  expect(res).not.toBe(defaultObject);

  params = { all: true };
  res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(defaultObject);
  expect(res).not.toBe(defaultObject);
});

test('params not correct type', () => {
  expect(() =>
    getFromObject({
      params: [],
      object: defaultObject,
      arrayIndices: defaultArrayIndices,
      operator,
      location,
    })
  ).toThrow('Operator Error: _operator params must be of type string, integer, boolean or object.');
});

test('params key not a string', () => {
  expect(() =>
    getFromObject({
      params: { key: {} },
      object: defaultObject,
      arrayIndices: defaultArrayIndices,
      operator,
      location,
    })
  ).toThrow('Operator Error: _operator.key must be of type string or integer.');
});

test('replace arrayIndices', () => {
  let params = 'array.$.subArray.$';
  let res = getFromObject({
    params,
    object: {
      array: [
        {
          subArray: [1, 2],
        },
        {
          subArray: [3, 4],
        },
      ],
    },
    arrayIndices: [1, 0],
    operator,
    location,
  });
  expect(res).toEqual(3);
  params = { key: 'array.$.subArray.$' };
  res = getFromObject({
    params,
    object: {
      array: [
        {
          subArray: [1, 2],
        },
        {
          subArray: [3, 4],
        },
      ],
    },
    arrayIndices: [1, 0],
    operator,
    location,
  });
  expect(res).toEqual(3);

  params = 'array.$.subArray';
  res = getFromObject({
    params,
    object: {
      array: [
        {
          subArray: [1, 2],
        },
        {
          subArray: [3, 4],
        },
      ],
    },
    arrayIndices: [1, 0],
    operator,
    location,
  });
  expect(res).toEqual([3, 4]);
});

test('get a field from an object, default value', () => {
  let params = { key: 'not_there', default: 'default' };
  let res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual('default');

  params = { key: 'not_there', default: false };
  res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(false);

  params = { key: 'not_there', default: 0 };
  res = getFromObject({
    params,
    object: defaultObject,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
  });
  expect(res).toEqual(0);
});
