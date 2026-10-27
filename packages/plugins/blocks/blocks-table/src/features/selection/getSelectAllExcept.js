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

import isRowSelectable from './isRowSelectable.js';

// The `except` keys of an `{ all: true, except }` selection: the rows the user cleared since
// selecting all (recorded by toggleRowSelected), including rows that are not loaded now (server
// mode evicts and reloads blocks), plus exceptions the value set from outside, plus the rows the
// all selection covers that `rowSelection.selectable` rejects, so resolving the value leaves them
// out too. Client-side those are the filtered rows; in server mode the loaded ones (the server
// resolves rows that are not loaded, untested).
function getSelectAllExcept({ api }) {
  const except = new Map(api.selectionExcept);
  if (api.config.rowSelection?.isSelectable) {
    const { rows } = api.config.server
      ? api.table.getCoreRowModel()
      : api.table.getFilteredRowModel();
    rows.forEach((row) => {
      if (!isRowSelectable({ api, original: row.original })) {
        except.set(row.id, api.config.getKey(row.original));
      }
    });
  }
  return [...except.values()];
}

export default getSelectAllExcept;
