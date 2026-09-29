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

import { constructRow, makeObjectMap, tableMemo } from '@tanstack/react-table';

function buildRowModel({ table, data, previous }) {
  const rows = new Array(data.length);
  const rowsById = makeObjectMap();
  for (let i = 0; i < data.length; i++) {
    const original = data[i];
    const id = table.getRowId(original, i);
    const prior = previous?.rowsById[id];
    const row =
      prior !== undefined && prior.original === original && prior.index === i
        ? prior
        : constructRow(table, id, original, i, 0);
    rows[i] = row;
    rowsById[id] = row;
  }
  return { rows, flatRows: rows, rowsById };
}

// Same rows in the same places with a few row objects replaced: patch those rows and the id
// index instead of rebuilding either. Returns null when rows moved, arrived or left.
function patchRowModel({ table, data, previous }) {
  if (!previous || previous.rows.length !== data.length) return null;
  let rows = null;
  const replaced = [];
  for (let i = 0; i < data.length; i++) {
    const prior = previous.rows[i];
    const original = data[i];
    if (prior.original === original) continue;
    const id = table.getRowId(original, i);
    if (id !== prior.id) return null;
    if (rows === null) rows = previous.rows.slice();
    rows[i] = constructRow(table, id, original, i, 0);
    replaced.push(rows[i]);
  }
  if (rows === null) return previous;
  // The previous model is never read again, so its id index is patched in place.
  replaced.forEach((row) => {
    previous.rowsById[row.id] = row;
  });
  return { rows, flatRows: rows, rowsById: previous.rowsById };
}

// Replaces TanStack's core row model for flat data. A row whose object and index are unchanged
// keeps its TanStack Row instance (and its value caches), so updating one row of 100k patches one
// row instead of rebuilding 100k Row objects and a 100k-key id index (D10 row-update). Data
// changes never auto-reset table state here: the Lowdefy table owns sorting, selection and
// expansion through its value.
function createStableCoreRowModel() {
  return function getCoreRowModel(table) {
    let previous = null;
    return tableMemo({
      feature: 'coreRowModelsFeature',
      table,
      fnName: 'table.getCoreRowModel',
      memoDeps: () => [table.options.data],
      fn: () => {
        const data = table.options.data;
        previous =
          patchRowModel({ table, data, previous }) ?? buildRowModel({ table, data, previous });
        return previous;
      },
    });
  };
}

export default createStableCoreRowModel;
