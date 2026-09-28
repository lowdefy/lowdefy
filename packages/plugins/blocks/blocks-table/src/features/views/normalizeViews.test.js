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

import findActiveView from './findActiveView.js';
import normalizeViews from './normalizeViews.js';

test('normalizeViews treats a list that has not loaded as no views', () => {
  assert.deepEqual(normalizeViews(null), []);
  assert.deepEqual(normalizeViews(undefined), []);
});

test('normalizeViews keeps the id as given and keys views by its string', () => {
  assert.deepEqual(normalizeViews([{ id: 7, view: { sort: [] }, count: 3 }, { id: 7 }, {}]), [
    {
      id: 7,
      key: '7',
      title: '7',
      view: { sort: [] },
      shared: false,
      locked: false,
      count: 3,
    },
  ]);
});

test('findActiveView finds the view by id, else the first view', () => {
  const views = normalizeViews([{ id: 'all' }, { id: 2 }]);
  assert.equal(findActiveView({ views, id: 2 }).id, 2);
  assert.equal(findActiveView({ views, id: '2' }).id, 2);
  assert.equal(findActiveView({ views, id: 'gone' }).id, 'all');
  assert.equal(findActiveView({ views, id: null }).id, 'all');
  assert.equal(findActiveView({ views: [], id: 'all' }), null);
});
