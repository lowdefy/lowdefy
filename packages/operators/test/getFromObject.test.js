/*
  Copyright 2020 Lowdefy, Inc

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

import getFromObject from '../src/getFromObject';
// eslint-disable-next-line no-unused-vars
import getFromOtherContext from '../src/getFromOtherContext';

jest.mock('../src/getFromOtherContext');

const location = 'location';
const operator = '_operator';
const defaultArrayIndices = [];
const contexts = {};
const context = {};
const defaultObject = { string: 'string', obj: { key: 'value' } };

test('get a field from an object, shorthand', () => {
  const params = 'string';
  const res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual('string');
});

test('get a field from an object, key as param', () => {
  const params = { key: 'string' };
  const res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual('string');
});

test('get an entire object, shorthand', () => {
  const params = true;
  const res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject);
});

test('get an entire object, params all', () => {
  const params = { all: true };
  const res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject);
});

test('copy results', () => {
  let params = 'obj';
  let res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject.obj);
  expect(res).not.toBe(defaultObject.obj);
  params = { key: 'obj' };
  res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject.obj);
  expect(res).not.toBe(defaultObject.obj);

  params = true;
  res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject);
  expect(res).not.toBe(defaultObject);

  params = { all: true };
  res = getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'node',
  });
  expect(res).toEqual(defaultObject);
  expect(res).not.toBe(defaultObject);
});

test('get from another context, web', () => {
  const params = { key: 'string', contextId: 'contextId' };
  getFromObject({
    params,
    object: defaultObject,
    context,
    contexts,
    arrayIndices: defaultArrayIndices,
    operator,
    location,
    env: 'web',
  });
  expect(getFromOtherContext).toHaveBeenCalled();
});

test('get from another context, node', () => {
  expect(() =>
    getFromObject({
      params: { key: 'string', contextId: 'contextId' },
      object: defaultObject,
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator,
      location,
      env: 'node',
    })
  ).toThrow(
    'Operator Error: Accessing a context using contextId is only available in a client environment.'
  );
});

test('params not correct type', () => {
  expect(() =>
    getFromObject({
      params: [],
      object: defaultObject,
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator,
      location,
      env: 'node',
    })
  ).toThrow('Operator Error: _operator params must be of type string, boolean or object.');
});

test('params key not a string', () => {
  expect(() =>
    getFromObject({
      params: { key: {} },
      object: defaultObject,
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator,
      location,
      env: 'node',
    })
  ).toThrow('Operator Error: _operator.key must be of type string.');
});
