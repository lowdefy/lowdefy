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

import mapPlainValues from './mapPlainValues.js';

function upper(value) {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

test('mapPlainValues maps leaves in nested objects and arrays without mutating the input', () => {
  const input = { a: 'x', b: [{ c: 'y' }, 'z', 1] };
  expect(mapPlainValues(input, upper)).toEqual({ a: 'X', b: [{ c: 'Y' }, 'Z', 1] });
  expect(input).toEqual({ a: 'x', b: [{ c: 'y' }, 'z', 1] });
});

test('mapPlainValues replaces a whole subtree when visit returns a different value for it', () => {
  const visit = (value, key) => (key === 'secret' ? '[REDACTED]' : value);
  expect(mapPlainValues({ secret: { a: 1 }, items: [{ secret: 'b', id: 2 }] }, visit)).toEqual({
    secret: '[REDACTED]',
    items: [{ secret: '[REDACTED]', id: 2 }],
  });
});

test('mapPlainValues keeps class instances, Dates and Errors by reference', () => {
  class Client {
    constructor() {
      this.token = 'x';
    }
  }
  const client = new Client();
  const date = new Date(0);
  const error = new Error('e');
  const mapped = mapPlainValues({ client, date, error }, upper);
  expect(mapped.client).toBe(client);
  expect(mapped.date).toBe(date);
  expect(mapped.error).toBe(error);
});

test('mapPlainValues copies a cycle as a cycle', () => {
  const input = { name: 'a' };
  input.self = input;
  const mapped = mapPlainValues(input, upper);
  expect(mapped.name).toBe('A');
  expect(mapped.self).toBe(mapped);
});
