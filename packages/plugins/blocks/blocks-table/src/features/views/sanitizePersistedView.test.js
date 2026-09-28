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

import sanitizePersistedView from './sanitizePersistedView.js';

const columnKeys = ['name', 'stage', 'amount', 'source'];

test('sanitizePersistedView drops unknown view keys', () => {
  assert.deepEqual(
    sanitizePersistedView({
      view: { sort: [{ key: 'name' }], selected: ['a'], legacy: true, density: 'compact' },
      columnKeys,
    }),
    { sort: [{ key: 'name' }], density: 'compact' }
  );
});

test('sanitizePersistedView drops columns that no longer exist and appends new ones hidden', () => {
  assert.deepEqual(
    sanitizePersistedView({
      view: {
        columns: [
          { key: 'amount', width: 120 },
          { key: 'removed' },
          { key: 'name', pinned: 'start' },
          { key: 'amount' },
          'junk',
        ],
      },
      columnKeys,
    }),
    {
      columns: [
        { key: 'amount', width: 120 },
        { key: 'name', pinned: 'start' },
        { key: 'stage', hidden: true },
        { key: 'source', hidden: true },
      ],
    }
  );
});

test('sanitizePersistedView keeps a view without columns following the configured layout', () => {
  assert.deepEqual(sanitizePersistedView({ view: { sort: [] }, columnKeys }), { sort: [] });
  assert.deepEqual(sanitizePersistedView({ view: { columns: 'bad' }, columnKeys }), {});
});

test('sanitizePersistedView returns null for a stored value that is not a view', () => {
  assert.equal(sanitizePersistedView({ view: null, columnKeys }), null);
  assert.equal(sanitizePersistedView({ view: [], columnKeys }), null);
});
