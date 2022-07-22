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

import * as uuid from 'uuid';
import _uuid from './uuid.js';

jest.mock('uuid', () => {
  return {
    v1: jest.fn(() => 'ABC-v1'),
    v3: jest.fn(() => 'ABC-v3'),
    v4: jest.fn(() => 'ABC-v4'),
    v5: jest.fn(() => 'ABC-v5'),
  };
});

test('_uuid: true', () => {
  expect(_uuid({ params: true })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid: null', () => {
  expect(_uuid({ params: null })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid: undefined', () => {
  expect(_uuid({ params: undefined })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid.v1', () => {
  expect(_uuid({ methodName: 'v1' })).toEqual('ABC-v1');
  expect(uuid.v1).toHaveBeenCalled();
});

test('_uuid.v3: ["hello", "world"]', () => {
  expect(_uuid({ methodName: 'v3', params: ['hello', 'world'] })).toEqual('ABC-v3');
  expect(uuid.v3).toHaveBeenCalled();
});

test('_uuid.v3: {"name":"hello", "namespace":"world"}', () => {
  expect(
    _uuid({
      methodName: 'v3',
      params: { name: 'hello', namespace: 'world' },
    })
  ).toEqual('ABC-v3');
  expect(uuid.v3).toHaveBeenCalled();
});

test('_uuid.v4', () => {
  expect(_uuid({ methodName: 'v4' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid.v5: ["hello", "world"]', () => {
  expect(_uuid({ methodName: 'v5', params: ['hello', 'world'] })).toEqual('ABC-v5');
  expect(uuid.v5).toHaveBeenCalled();
});

test('_uuid.v5: {"name":"hello", "namespace":"world"}', () => {
  expect(
    _uuid({
      methodName: 'v5',
      params: { name: 'hello', namespace: 'world' },
    })
  ).toEqual('ABC-v5');
  expect(uuid.v5).toHaveBeenCalled();
});

test('_uuid: error', () => {
  expect(() => _uuid({ params: 'error' })).toThrow();
});
