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

import { expect, test } from 'vitest';

import {
  any,
  anything,
  arrayContaining,
  assertEquals,
  objectContaining,
  stringMatching,
} from './index.js';

function failure(run) {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

test('assertEquals passes for equal nested objects, arrays, dates and null', () => {
  const created = new Date('2026-01-02T03:04:05Z');
  assertEquals(
    { id: 'BR-1', lines: [{ amount: 10 }, { amount: 20 }], created, closed: null },
    {
      id: 'BR-1',
      lines: [{ amount: 10 }, { amount: 20 }],
      created: new Date(created.getTime()),
      closed: null,
    }
  );
});

test('assertEquals treats a key that is undefined as a key that is absent, both ways', () => {
  assertEquals({ id: 1, note: undefined }, { id: 1 });
  assertEquals({ id: 1 }, { id: 1, note: undefined });
});

test('assertEquals fails naming the path, the actual and the expected value of the first difference', () => {
  const error = failure(() =>
    assertEquals(
      { run: { lines: [{ amount: 10 }, { amount: 25 }] } },
      { run: { lines: [{ amount: 10 }, { amount: 20 }] } }
    )
  );
  expect(error.name).toEqual('AssertionError');
  expect(error.message).toContain('run.lines[1].amount is not equal.');
  expect(error.message).toContain('actual:   25');
  expect(error.message).toContain('expected: 20');
  expect(error.operator).toEqual('assertEquals');
});

test('assertEquals fails on a key the expected value does not name', () => {
  const error = failure(() => assertEquals({ id: 1, stage: 'draft' }, { id: 1 }));
  expect(error.message).toContain('stage is not expected.');
});

test('assertEquals fails on a missing key and on an array of another length', () => {
  expect(failure(() => assertEquals({ id: 1 }, { id: 1, stage: 'draft' })).message).toContain(
    'stage is missing.'
  );
  expect(failure(() => assertEquals({ tags: ['a'] }, { tags: ['a', 'b'] })).message).toContain(
    'tags has 1 items, expected 2.'
  );
});

test('assertEquals does not equate a number with its string, or an object with an array', () => {
  expect(failure(() => assertEquals(1, '1'))).not.toBeNull();
  expect(failure(() => assertEquals([], {})).message).toContain('The value is not an object.');
  expect(failure(() => assertEquals({}, [])).message).toContain('The value is not an array.');
});

test('assertEquals puts the message given to it first', () => {
  const error = failure(() => assertEquals(1, 2, 'the run total'));
  expect(error.message.split('\n')[0]).toEqual('the run total');
});

test('any matches values of the type and nothing that is null or undefined', () => {
  assertEquals(
    { id: 'x', count: 2, at: new Date(), done: false, tags: [], meta: {} },
    {
      id: any(String),
      count: any(Number),
      at: any(Date),
      done: any(Boolean),
      tags: any(Array),
      meta: any(Object),
    }
  );
  const error = failure(() => assertEquals({ id: 7 }, { id: any(String) }));
  expect(error.message).toContain('id is not any(String).');
  expect(error.message).toContain("expected: '<any(String)>'");
  expect(failure(() => assertEquals({ id: null }, { id: any(Object) }))).not.toBeNull();
  expect(() => any('String')).toThrow('any() takes a constructor');
});

test('anything matches every value but null and undefined', () => {
  assertEquals({ id: 0, name: '' }, { id: anything(), name: anything() });
  expect(failure(() => assertEquals({ id: null }, { id: anything() })).message).toContain(
    'id is not anything().'
  );
  expect(failure(() => assertEquals({}, { id: anything() })).message).toContain('id is missing.');
});

test('objectContaining relaxes one object inside assertEquals', () => {
  assertEquals(
    { run: { id: 'BR-1', stage: 'approved', by: 'u1' } },
    { run: objectContaining({ stage: 'approved' }) }
  );
  expect(
    failure(() =>
      assertEquals(
        { run: { id: 'BR-1', stage: 'draft' } },
        { run: objectContaining({ stage: 'approved' }) }
      )
    ).message
  ).toContain('run is not objectContaining(...).');
  expect(() => objectContaining(['a'])).toThrow('objectContaining() takes an object');
});

test('arrayContaining matches items in any order and allows more', () => {
  assertEquals(
    { roles: ['finance', 'admin', 'viewer'] },
    { roles: arrayContaining(['admin', 'finance']) }
  );
  assertEquals(
    [
      { id: 1, n: 'a' },
      { id: 2, n: 'b' },
    ],
    arrayContaining([objectContaining({ id: 2 })])
  );
  expect(
    failure(() => assertEquals({ roles: ['viewer'] }, { roles: arrayContaining(['admin']) }))
  ).not.toBeNull();
  expect(() => arrayContaining('admin')).toThrow('arrayContaining() takes an array');
});

test('stringMatching takes a regular expression or a piece of text', () => {
  assertEquals({ message: 'Run BR-1 approved' }, { message: stringMatching(/^Run BR-\d+/) });
  assertEquals({ message: 'Run BR-1 approved' }, { message: stringMatching('approved') });
  const pattern = /BR/g;
  assertEquals('BR-1', stringMatching(pattern));
  assertEquals('BR-1', stringMatching(pattern));
  expect(
    failure(() => assertEquals({ message: 7 }, { message: stringMatching('7') }))
  ).not.toBeNull();
  expect(() => stringMatching(7)).toThrow('stringMatching() takes a regular expression');
});
