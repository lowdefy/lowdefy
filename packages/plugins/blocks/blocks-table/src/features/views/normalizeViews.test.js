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

test('normalizeViews keys ObjectId ids by their hex and keeps the id as given', () => {
  const views = normalizeViews([
    { id: { _oid: '65f1c0ffee0000000000000a' }, title: 'Mine' },
    { id: { _oid: '65f1c0ffee0000000000000b' }, title: 'Team' },
    { id: { _oid: '65f1c0ffee0000000000000a' }, title: 'Duplicate' },
  ]);
  assert.deepEqual(
    views.map((view) => view.key),
    ['65f1c0ffee0000000000000a', '65f1c0ffee0000000000000b']
  );
  assert.deepEqual(views[1].id, { _oid: '65f1c0ffee0000000000000b' });
  assert.equal(findActiveView({ views, id: { _oid: '65f1c0ffee0000000000000b' } }).title, 'Team');
  assert.equal(findActiveView({ views, id: '65f1c0ffee0000000000000b' }).title, 'Team');
});

test('normalizeViews keys other object ids by their JSON', () => {
  const views = normalizeViews([{ id: { a: 1 } }, { id: { a: 2 } }]);
  assert.deepEqual(
    views.map((view) => view.key),
    ['{"a":1}', '{"a":2}']
  );
  assert.equal(findActiveView({ views, id: { a: 2 } }).key, '{"a":2}');
});
