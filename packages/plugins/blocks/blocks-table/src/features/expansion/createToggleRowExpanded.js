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

import createChildLoads from '../tree/createChildLoads.js';
import getExpandedIds from './getExpandedIds.js';
import rowNeedsChildren from '../tree/rowNeedsChildren.js';

const CHILDREN_ERROR = "Couldn't load the rows.";

function getChildrenError(result) {
  if (result?.success !== false) return null;
  return result.error?.error?.message ?? result.error?.message ?? CHILDREN_ERROR;
}

// Expands or collapses a row (a tree node or a row with a detail row), writes `expanded` to the
// value and fires `onRowExpand { row, rowKey, expanded, needsChildren }`. `needsChildren` is true
// when a lazy tree row is expanded before its children are in `data`. `expanded` omitted
// toggles. A lazy expand is awaited (D17): the row shows a spinner and a skeleton child while the
// event runs; if it fails, the row collapses and its chevron shows the error.
function createToggleRowExpanded(api) {
  api.childLoads = createChildLoads();

  async function loadChildren({ id, rowKey, event }) {
    api.childLoads.start(id);
    const result = await api.methods.triggerEvent({ name: 'onRowExpand', event });
    const error = getChildrenError(result);
    if (error) {
      api.updateSlice(
        'expanded',
        (previous) => previous.filter((key) => String(key) !== String(rowKey)),
        { cause: 'expand' }
      );
    }
    api.childLoads.finish(id, error);
  }

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
    const needsChildren = next && rowNeedsChildren({ api, id, row });
    const event = { row: row.original, rowKey, expanded: next, needsChildren };
    if (needsChildren) {
      loadChildren({ id, rowKey, event });
      return true;
    }
    api.childLoads.clearError(id);
    api.methods.triggerEvent({ name: 'onRowExpand', event });
    return true;
  };
}

export default createToggleRowExpanded;
