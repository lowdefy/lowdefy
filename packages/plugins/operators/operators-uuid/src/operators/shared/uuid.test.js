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
import { jest } from '@jest/globals';

jest.unstable_mockModule('uuid', () => {
  return {
    v1: jest.fn(() => 'ABC-v1'),
    v3: jest.fn(() => 'ABC-v3'),
    v4: jest.fn(() => 'ABC-v4'),
    v5: jest.fn(() => 'ABC-v5'),
  };
});

test('_uuid: true', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ params: true, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid: null', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ params: null, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid: undefined', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ params: undefined, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid.v1', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ methodName: 'v1', location: 'locationId' })).toEqual('ABC-v1');
  expect(uuid.v1).toHaveBeenCalled();
});

test('_uuid.v3: ["hello", "world"]', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ methodName: 'v3', params: ['hello', 'world'], location: 'locationId' })).toEqual(
    'ABC-v3'
  );
  expect(uuid.v3).toHaveBeenCalled();
});

test('_uuid.v3: {"name":"hello", "namespace":"world"}', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(
    _uuid({
      methodName: 'v3',
      params: { name: 'hello', namespace: 'world' },
      location: 'locationId',
    })
  ).toEqual('ABC-v3');
  expect(uuid.v3).toHaveBeenCalled();
});

test('_uuidV4', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ methodName: 'v4', location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});

test('_uuid.v5: ["hello", "world"]', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(_uuid({ methodName: 'v5', params: ['hello', 'world'], location: 'locationId' })).toEqual(
    'ABC-v5'
  );
  expect(uuid.v5).toHaveBeenCalled();
});

test('_uuid.v5: {"name":"hello", "namespace":"world"}', async () => {
  const uuid = await import('uuid');
  const _uuid = (await import('./uuid.js')).default;
  expect(
    _uuid({
      methodName: 'v5',
      params: { name: 'hello', namespace: 'world' },
      location: 'locationId',
    })
  ).toEqual('ABC-v5');
  expect(uuid.v5).toHaveBeenCalled();
});

test('_uuid: error', async () => {
  const _uuid = (await import('./uuid.js')).default;
  expect(() => _uuid({ params: 'error', location: 'locationId' })).toThrow();
});
