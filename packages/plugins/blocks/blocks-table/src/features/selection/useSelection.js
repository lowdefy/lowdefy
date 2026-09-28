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

import SelectAllHeader from './SelectAllHeader.js';
import SelectCell from './SelectCell.js';

const SELECT_COLUMN_WIDTH = 40;

// While the selection is `{ all: true, except }`, rows that appear in later data are selected
// too: "all" means every row, not the rows that happened to be loaded. Rows in `except` stay out
// when their block is loaded again (server mode).
function useSelection(ctx) {
  const { api, data, state } = ctx;
  const enabled = Boolean(ctx.config.rowSelection);
  const previousRowsById = useRef(null);

  useEffect(() => {
    const rowsById = api.table.getCoreRowModel().rowsById;
    const previous = previousRowsById.current;
    previousRowsById.current = rowsById;
    if (!previous || state.selectionMode !== 'all') return;
    const added = Object.keys(rowsById).filter(
      (id) => !previous[id] && !api.selectionExcept.has(id)
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

  const leadingColumns = useMemo(
    () =>
      enabled
        ? [
            {
              key: '__select',
              special: 'select',
              width: SELECT_COLUMN_WIDTH,
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
