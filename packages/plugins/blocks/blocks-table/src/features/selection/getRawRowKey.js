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

// Row ids in TanStack state are strings; the value keeps the row key's own type (a numeric `id`
// stays a number). Keys of rows that are not loaded (`preserve`) fall back to the key the value
// supplied.
function getRawRowKey({ id, api }) {
  const row = api.table.getCoreRowModel().rowsById[id];
  if (row) return api.config.getKey(row.original);
  return api.foreignKeys.get(id) ?? id;
}

export default getRawRowKey;
