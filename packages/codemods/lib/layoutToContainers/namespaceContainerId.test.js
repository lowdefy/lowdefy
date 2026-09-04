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
import test from 'node:test';

import namespaceContainerId from './namespaceContainerId.js';
import { gapToToken } from './areaToContainer.js';

test('namespaceContainerId numbers containers under the parent block id', () => {
  assert.equal(namespaceContainerId({ parentId: 'home', kind: 'grid', index: 1 }), 'home_grid_1');
  assert.equal(
    namespaceContainerId({ parentId: 'page.card', kind: 'row', index: 2 }),
    'page.card_row_2'
  );
});

test('namespaceContainerId rejects a parent id that is not a non-empty string', () => {
  assert.throws(() => namespaceContainerId({ parentId: '', kind: 'grid', index: 1 }), /non-empty/);
  assert.throws(
    () => namespaceContainerId({ parentId: undefined, kind: 'grid', index: 1 }),
    /non-empty/
  );
});

test('namespaceContainerId rejects an id with an empty or reserved path segment', () => {
  assert.throws(
    () => namespaceContainerId({ parentId: 'home..card', kind: 'grid', index: 1 }),
    /empty path segment/
  );
  assert.throws(
    () => namespaceContainerId({ parentId: '~internal', kind: 'grid', index: 1 }),
    /reserved path segment/
  );
});

test('gapToToken maps the exact gap-* pixel values and reports a rounded one', () => {
  assert.deepEqual(gapToToken(16), { token: 'md' });
  assert.deepEqual(gapToToken('8px'), { token: 'sm' });
  // A tie rounds down: the smaller gap never grows the layout.
  assert.deepEqual(gapToToken(20), {
    token: 'md',
    approximated: '20px to gap: md (16px)',
  });
  assert.deepEqual(gapToToken('none'), { token: null });
});
