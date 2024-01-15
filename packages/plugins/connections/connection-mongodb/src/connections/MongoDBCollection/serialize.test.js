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

import { ObjectId } from 'mongodb';
import { serialize, deserialize } from './serialize.js';

test('serialize with  dates', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(serialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('deserialize does not turn dates to strings', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(deserialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('serialize mongodb object id', () => {
  const object = {
    objectid: ObjectId.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectId.createFromHexString('5e53d8403108c4b9fa51765d')],
  };
  expect(serialize(object)).toEqual({
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  });
});

test('deserialize mongodb object id', () => {
  const object = {
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  };
  expect(deserialize(object)).toEqual({
    objectid: ObjectId.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectId.createFromHexString('5e53d8403108c4b9fa51765d')],
  });
});

test('undefined', () => {
  expect(deserialize(undefined)).toEqual(undefined);
  expect(serialize(undefined)).toEqual(undefined);
});
