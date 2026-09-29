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

import { useEffect, useMemo, useRef } from 'react';

import isSelectionViewCurrent from './isSelectionViewCurrent.js';
import SelectAllHeader from './SelectAllHeader.js';
import SelectCell from './SelectCell.js';
import selectColumnWidth from './selectColumnWidth.js';

// While the selection is `{ all: true, except }`, rows that appear in later data and match the
// view are selected too: "all matching" means every row the filter and search match, not the rows
// that happened to be loaded. Client-side that is the filtered rows; in server mode the server
// matches, so every loaded row counts. Rows in `except` stay out when their block is loaded again
// (server mode).
function useSelection(ctx) {
  const { api, data, state } = ctx;
  const enabled = Boolean(ctx.config.rowSelection);
  const previousRowsById = useRef(null);

  useEffect(() => {
    const rowsById = api.table.getCoreRowModel().rowsById;
    const previous = previousRowsById.current;
    previousRowsById.current = rowsById;
    if (!previous || state.selectionMode !== 'all') return;
    const matching = api.config.server ? rowsById : api.table.getFilteredRowModel().rowsById;
    const added = Object.keys(rowsById).filter(
      (id) => !previous[id] && matching[id] && !api.selectionExcept.has(id)
    );
    if (!added.length) return;
    api.setSliceSilently('rowSelection', (selection) => {
      const next = { ...selection };
      added.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [data]);

  // An all selection belongs to the filter and search it was made with: the rows another filter
  // matches are a different set, so changing either (from the table or the value) clears it.
  useEffect(() => {
    if (state.selectionMode !== 'all' || isSelectionViewCurrent({ state })) return;
    api.actions.clearSelection();
  }, [state.filter, state.search, state.selectionMode, state.selectionView]);

  const leadingColumns = useMemo(
    () =>
      enabled
        ? [
            {
              key: '__select',
              special: 'select',
              width: selectColumnWidth,
              Header: SelectAllHeader,
              Cell: SelectCell,
            },
          ]
        : [],
    [enabled]
  );
  return { leadingColumns };
}

export default useSelection;
