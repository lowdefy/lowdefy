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

import toJsonShape from './toJsonShape.js';

test('toJsonShape turns a Date into its ISO string', () => {
  expect(toJsonShape({ value: { at: new Date(0) } })).toEqual({ at: '1970-01-01T00:00:00.000Z' });
  expect(toJsonShape({ value: new Date(0) })).toEqual('1970-01-01T00:00:00.000Z');
});

test('toJsonShape drops undefined properties, as the wire does', () => {
  expect(toJsonShape({ value: { a: 1, b: undefined } })).toEqual({ a: 1 });
});

test('toJsonShape returns undefined unchanged', () => {
  expect(toJsonShape({ value: undefined })).toBe(undefined);
});

test('toJsonShape uses toJSON, so a driver id becomes its string form', () => {
  class ObjectId {
    toJSON() {
      return '507f1f77bcf86cd799439011';
    }
  }
  expect(toJsonShape({ value: { _id: new ObjectId() } })).toEqual({
    _id: '507f1f77bcf86cd799439011',
  });
});
