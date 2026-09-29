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

import { type } from '@lowdefy/helpers';

import getExpandedIds from './getExpandedIds.js';

// Expands or collapses a row (a tree node or a row with a detail row), writes `expanded` to the
// value and fires `onRowExpand { row, rowKey, expanded }`. `expanded` omitted toggles.
function createToggleRowExpanded(api) {
  return function toggleRowExpanded({ id, expanded }) {
    const row = api.table.getRow(id, true);
    if (!row) return false;
    const rowKey = api.config.getKey(row.original);
    const isExpanded = getExpandedIds(api.state.expanded).has(id);
    const next = type.isBoolean(expanded) ? expanded : !isExpanded;
    if (next === isExpanded) return true;
    api.updateSlice(
      'expanded',
      (previous) => (next ? [...previous, rowKey] : previous.filter((key) => String(key) !== id)),
      { cause: 'expand' }
    );
    api.methods.triggerEvent({
      name: 'onRowExpand',
      event: { row: row.original, rowKey, expanded: next },
    });
    return true;
  };
}

export default createToggleRowExpanded;
