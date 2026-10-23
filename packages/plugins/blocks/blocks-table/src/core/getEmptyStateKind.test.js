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

// The table decides from its view state, which client and server mode share, so one decision
// covers both modes.
import getEmptyStateKind from './getEmptyStateKind.js';
import isViewFiltered from './isViewFiltered.js';

const slot = () => null;
const viewFilter = { and: [{ key: 'stage', op: 'in', value: ['won'] }] };

test('getEmptyStateKind shows emptyFiltered when a filter hides every row and the block has it', () => {
  const filtered = isViewFiltered({ filter: viewFilter, search: null });
  expect(filtered).toBe(true);
  expect(getEmptyStateKind({ content: { emptyFiltered: slot, empty: slot }, filtered })).toBe(
    'emptyFiltered'
  );
  expect(getEmptyStateKind({ content: { empty: slot }, filtered })).toBe('filtered');
});

test('getEmptyStateKind treats a search that matches nothing as filtered', () => {
  const filtered = isViewFiltered({ filter: null, search: 'acme' });
  expect(getEmptyStateKind({ content: { emptyFiltered: slot }, filtered })).toBe('emptyFiltered');
});

test('getEmptyStateKind shows empty, else emptyText, with no rows and no filter', () => {
  const filtered = isViewFiltered({ filter: { and: [] }, search: '' });
  expect(filtered).toBe(false);
  expect(getEmptyStateKind({ content: { emptyFiltered: slot, empty: slot }, filtered })).toBe(
    'empty'
  );
  expect(getEmptyStateKind({ content: { emptyFiltered: slot }, filtered })).toBe('text');
});
