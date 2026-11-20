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

import compareText from './compareText.mjs';

test('compareText finds equal texts identical', () => {
  assert.deepEqual(compareText({ file: 'build/a.json', baseline: '{}', current: '{}' }), {
    identical: true,
    lines: [],
  });
});

test('compareText lists the differing paths of a JSON file with both values', () => {
  const result = compareText({
    file: 'build/menus.json',
    baseline: JSON.stringify({ menus: [{ id: 'default', links: [] }] }),
    current: JSON.stringify({ menus: [{ id: 'default', links: [], extra: true }] }),
  });
  assert.equal(result.identical, false);
  assert.deepEqual(result.lines, ['menus[0].extra: (missing) → true']);
});

test('compareText says when JSON values match but bytes do not', () => {
  const result = compareText({
    file: 'build/refMap.json',
    baseline: '{"a":1,"b":2}',
    current: '{"b":2,"a":1}',
  });
  assert.equal(result.identical, false);
  assert.equal(result.lines[0], 'Same JSON values in different bytes (key order or formatting).');
});

test('compareText shows a unified diff for other files', () => {
  const result = compareText({
    file: 'build/globals.css',
    baseline: 'a {}\nb {}\n',
    current: 'a {}\nc {}\n',
  });
  assert.equal(result.identical, false);
  assert.ok(result.lines.includes('--- a/baseline/build/globals.css'));
  assert.ok(result.lines.includes('+++ b/current/build/globals.css'));
  assert.ok(result.lines.includes('-b {}'));
  assert.ok(result.lines.includes('+c {}'));
});
