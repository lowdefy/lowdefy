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
import matchExpectation from './matchExpectation.js';

test('matchExpectation ignores extra response keys', () => {
  expect(matchExpectation({ expected: { a: 1 }, actual: { a: 1, b: 2, c: { d: 3 } } })).toEqual({
    matched: true,
  });
});

test('matchExpectation fails a missing key with its path', () => {
  expect(matchExpectation({ expected: { a: { b: 1 } }, actual: { a: { c: 1 } } })).toEqual({
    matched: false,
    path: 'a.b',
    expected: 1,
    actual: undefined,
  });
});

test('matchExpectation fails a differing leaf with its path', () => {
  expect(
    matchExpectation({ expected: [{ status: 'open' }], actual: [{ status: 'closed', x: 1 }] })
  ).toEqual({ matched: false, path: '0.status', expected: 'open', actual: 'closed' });
});

test('matchExpectation fails an array length mismatch', () => {
  expect(matchExpectation({ expected: [{ a: 1 }], actual: [{ a: 1 }, { a: 2 }] })).toEqual({
    matched: false,
    path: 'length',
    expected: 1,
    actual: 2,
  });
});

test('matchExpectation fails when an array is expected but an object is returned', () => {
  expect(matchExpectation({ expected: [1], actual: { 0: 1 } })).toEqual({
    matched: false,
    path: '',
    expected: [1],
    actual: { 0: 1 },
  });
});

test('matchExpectation matches a nested subset element-wise', () => {
  expect(
    matchExpectation({
      expected: { rows: [{ id: 1, tags: ['a', 'b'] }, { id: 2 }] },
      actual: {
        rows: [
          { id: 1, tags: ['a', 'b'], extra: true },
          { id: 2, more: 1 },
        ],
        total: 2,
      },
    })
  ).toEqual({ matched: true });
});

test('matchExpectation compares dates by value', () => {
  const at = new Date('2026-01-01T00:00:00.000Z');
  expect(
    matchExpectation({ expected: { at }, actual: { at: new Date('2026-01-01T00:00:00.000Z') } })
  ).toEqual({ matched: true });
  expect(
    matchExpectation({ expected: { at }, actual: { at: '2026-01-01T00:00:00.000Z' } })
  ).toEqual({ matched: false, path: 'at', expected: at, actual: '2026-01-01T00:00:00.000Z' });
});

test('matchExpectation matches null and primitive responses literally', () => {
  expect(matchExpectation({ expected: null, actual: null })).toEqual({ matched: true });
  expect(matchExpectation({ expected: 3, actual: 3 })).toEqual({ matched: true });
  expect(matchExpectation({ expected: 3, actual: '3' })).toEqual({
    matched: false,
    path: '',
    expected: 3,
    actual: '3',
  });
});

test('matchExpectation routes { schema } to ajv and passes a conforming response', () => {
  expect(
    matchExpectation({ expected: { schema: { type: 'array', minItems: 1 } }, actual: [{ a: 1 }] })
  ).toEqual({ matched: true });
});

test('matchExpectation routes { schema } to ajv and reports a non-conforming response', () => {
  const result = matchExpectation({
    expected: { schema: { type: 'array', minItems: 1 } },
    actual: [],
  });
  expect(result.matched).toBe(false);
  expect(result.path).toEqual('');
  expect(result.actual).toEqual([]);
  expect(result.message).toContain('must NOT have fewer than 1 items');
});

test('matchExpectation treats schema beside other keys as a literal subset', () => {
  expect(
    matchExpectation({ expected: { schema: 'x', other: 1 }, actual: { schema: 'x', other: 1 } })
  ).toEqual({ matched: true });
});

test('matchExpectation { contains } passes when every expected element is present in any order', () => {
  expect(
    matchExpectation({
      expected: { contains: [{ title: 'Second' }, { title: 'First' }] },
      actual: [{ title: 'First' }, { title: 'Third' }, { title: 'Second' }],
    })
  ).toEqual({ matched: true });
});

test('matchExpectation { contains } names the element that was not found', () => {
  const result = matchExpectation({
    expected: { contains: [{ title: 'First' }, { title: 'Missing' }] },
    actual: [{ title: 'First' }],
  });
  expect(result.matched).toBe(false);
  expect(result.path).toEqual('contains.1');
  expect(result.expected).toEqual({ title: 'Missing' });
});

test('matchExpectation { contains } fails when the response is not an array', () => {
  expect(matchExpectation({ expected: { contains: [{ a: 1 }] }, actual: { a: 1 } }).matched).toBe(
    false
  );
});

test('matchExpectation keeps exact length as the default for a bare array', () => {
  const result = matchExpectation({
    expected: [{ title: 'First' }],
    actual: [{ title: 'First' }, { title: 'Second' }],
  });
  expect(result).toEqual({ matched: false, path: 'length', expected: 1, actual: 2 });
});

test('matchExpectation treats a non-array contains value as a literal subset', () => {
  expect(
    matchExpectation({ expected: { contains: 'text' }, actual: { contains: 'text' } })
  ).toEqual({ matched: true });
});

test('matchExpectation validates against a ~schema marker, the escape hatch for a schema key', () => {
  expect(
    matchExpectation({
      expected: { '~schema': { type: 'array' } },
      actual: [{ schema: 'public' }],
    })
  ).toEqual({ matched: true });
  const result = matchExpectation({
    expected: { '~schema': { type: 'object' } },
    actual: [{ schema: 'public' }],
  });
  expect(result.matched).toBe(false);
});
