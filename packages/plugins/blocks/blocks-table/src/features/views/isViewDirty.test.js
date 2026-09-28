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

import isViewDirty from './isViewDirty.js';

const defaults = {
  sort: [],
  filter: null,
  search: null,
  group: [],
  collapsedGroups: [],
  aggregates: {},
  density: 'default',
};

test('isViewDirty is false when the current view equals the saved view', () => {
  const view = { ...defaults, sort: [{ key: 'name' }] };
  assert.equal(isViewDirty({ current: view, saved: { ...view }, defaults }), false);
});

test('isViewDirty is true when a part that matters differs', () => {
  const saved = { ...defaults, sort: [{ key: 'name' }] };
  assert.equal(
    isViewDirty({ current: { ...saved, sort: [{ key: 'name', desc: true }] }, saved, defaults }),
    true
  );
  assert.equal(isViewDirty({ current: { ...saved, density: 'compact' }, saved, defaults }), true);
  assert.equal(
    isViewDirty({ current: { ...saved, columns: [{ key: 'name', width: 90 }] }, saved, defaults }),
    true
  );
});

test('isViewDirty ignores search text and collapsed groups', () => {
  const saved = { ...defaults, group: [{ key: 'stage' }] };
  const current = { ...saved, search: 'acme', collapsedGroups: ['["lead"]'] };
  assert.equal(isViewDirty({ current, saved, defaults }), false);
});

test('isViewDirty treats a missing part as the default part', () => {
  const current = { ...defaults, sort: [] };
  assert.equal(isViewDirty({ current, saved: { density: 'default' }, defaults }), false);
  assert.equal(
    isViewDirty({ current: { ...defaults, filter: null }, saved: { filter: undefined }, defaults }),
    false
  );
});

test('isViewDirty compares objects regardless of key order', () => {
  const saved = { ...defaults, filter: { and: [{ key: 'stage', op: 'in', value: ['lead'] }] } };
  const current = {
    ...defaults,
    filter: { and: [{ value: ['lead'], op: 'in', key: 'stage' }] },
  };
  assert.equal(isViewDirty({ current, saved, defaults }), false);
});
