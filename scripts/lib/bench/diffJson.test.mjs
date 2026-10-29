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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import diffJson from './diffJson.mjs';

test('diffJson returns no differences for equal values', () => {
  assert.deepEqual(diffJson({ baseline: { a: [1, { b: 2 }] }, current: { a: [1, { b: 2 }] } }), []);
});

test('diffJson names the path of a changed value with both values', () => {
  assert.deepEqual(
    diffJson({
      baseline: { blocks: [{}, {}, {}, { properties: { title: 'a' } }] },
      current: { blocks: [{}, {}, {}, { properties: { title: 'b' } }] },
    }),
    [{ path: 'blocks[3].properties.title', baseline: 'a', current: 'b' }]
  );
});

test('diffJson reports a key or array item one side lacks as undefined there, baseline keys first', () => {
  assert.deepEqual(diffJson({ baseline: { a: 1, list: [1] }, current: { b: 2, list: [1, 2] } }), [
    { path: 'a', baseline: 1, current: undefined },
    { path: 'list[1]', baseline: undefined, current: 2 },
    { path: 'b', baseline: undefined, current: 2 },
  ]);
});

test('diffJson reports a change of type at its path', () => {
  assert.deepEqual(diffJson({ baseline: { a: [1] }, current: { a: { 0: 1 } } }), [
    { path: 'a', baseline: [1], current: { 0: 1 } },
  ]);
});

test('diffJson stops at the limit', () => {
  const baseline = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i]));
  const current = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i + 1]));
  const differences = diffJson({ baseline, current, limit: 20 });
  assert.equal(differences.length, 20);
  assert.equal(differences[19].path, 'k19');
});

test('diffJson ignores key order', () => {
  assert.deepEqual(diffJson({ baseline: { a: 1, b: 2 }, current: { b: 2, a: 1 } }), []);
});
