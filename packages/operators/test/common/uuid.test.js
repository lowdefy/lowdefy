/*
  Copyright 2020-2021 Lowdefy, Inc

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

import uuid from 'uuid';
import _uuid from '../../src/common/uuid';

jest.mock('uuid', () => {
  return {
    v1: jest.fn(() => 'ABC-v1'),
    v2: jest.fn(() => 'ABC-v2'),
    v3: jest.fn(() => 'ABC-v3'),
    v4: jest.fn(() => 'ABC-v4'),
    v5: jest.fn(() => 'ABC-v5'),
  };
});

test('_uuid: true', () => {
  expect(_uuid({ params: true, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});
test('_uuid: null', () => {
  expect(_uuid({ params: null, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});
test('_uuid: undefined', () => {
  expect(_uuid({ params: undefined, location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});
test('_uuid: v1', () => {
  expect(_uuid({ params: 'v1', location: 'locationId' })).toEqual('ABC-v1');
  expect(uuid.v1).toHaveBeenCalled();
});
test('_uuid: v2', () => {
  expect(_uuid({ params: 'v2', location: 'locationId' })).toEqual('ABC-v2');
  expect(uuid.v2).toHaveBeenCalled();
});
test('_uuid: v3', () => {
  expect(_uuid({ params: 'v3', location: 'locationId' })).toEqual('ABC-v3');
  expect(uuid.v3).toHaveBeenCalled();
});
test('_uuid: v4', () => {
  expect(_uuid({ params: 'v4', location: 'locationId' })).toEqual('ABC-v4');
  expect(uuid.v4).toHaveBeenCalled();
});
test('_uuid: v5', () => {
  expect(_uuid({ params: 'v5', location: 'locationId' })).toEqual('ABC-v5');
  expect(uuid.v5).toHaveBeenCalled();
});
test('_uuid: error', () => {
  expect(() => _uuid({ params: 'error', location: 'locationId' })).toThrow();
});
