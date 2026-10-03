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

import diffStateWrites from './diffStateWrites.js';

test('diffStateWrites reports the path and JSON type of each changed leaf', () => {
  expect(diffStateWrites({ after: { a: 'x', n: 2, ok: true }, before: { a: 'x', n: 1 } })).toEqual([
    { path: 'n', type: 'number' },
    { path: 'ok', type: 'boolean' },
  ]);
});

test('diffStateWrites walks into objects and treats arrays as leaves', () => {
  expect(diffStateWrites({ after: { form: { name: 'a' }, rows: [1, 2] }, before: {} })).toEqual([
    { path: 'form.name', type: 'string' },
    { path: 'rows', type: 'array' },
  ]);
});

test('diffStateWrites reports a removed path as undefined', () => {
  expect(diffStateWrites({ after: {}, before: { a: 1 } })).toEqual([
    { path: 'a', type: 'undefined' },
  ]);
});

test('diffStateWrites omits values unless values is true', () => {
  expect(diffStateWrites({ after: { a: 'secret' }, before: {} })).toEqual([
    { path: 'a', type: 'string' },
  ]);
  expect(diffStateWrites({ after: { a: 'secret' }, before: {}, values: true })).toEqual([
    { path: 'a', type: 'string', value: 'secret' },
  ]);
});

test('diffStateWrites names a Date write as a date and does not throw on a cyclic value', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  const writes = diffStateWrites({
    after: { when: new Date('2026-01-02T03:04:05.000Z'), loop: cyclic },
    before: {},
    values: true,
  });
  expect(writes).toContainEqual({
    path: 'when',
    type: 'date',
    value: '2026-01-02T03:04:05.000Z',
  });
  expect(writes.find(({ path }) => path === 'loop.self')).toEqual({
    path: 'loop.self',
    type: 'object',
    value: null,
  });
});
