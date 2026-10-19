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

import parseStoredValue from './parseStoredValue.js';

test('parseStoredValue deserializes serialized JSON', () => {
  expect(parseStoredValue('{"a":[1,2]}')).toEqual({ a: [1, 2] });
});

test('parseStoredValue revives serialized dates', () => {
  expect(parseStoredValue('{"~d":1600000000000}')).toEqual(new Date(1600000000000));
});

test('parseStoredValue returns a plain string that is not valid JSON as it is', () => {
  expect(parseStoredValue('dark')).toEqual('dark');
});

test('parseStoredValue returns an empty string as it is', () => {
  expect(parseStoredValue('')).toEqual('');
});
