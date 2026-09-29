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

// The TanStack row with this id, on any page, filtered out or not; null when there is none.
// TanStack's `table.getRow(id, true)` searches the same models but throws for an unknown id. Ids
// come from the DOM and from event payloads (a row removed while its event ran, a server row that
// was evicted), so a miss is an expected answer, not an error.
function findRow({ table, id }) {
  return (
    table.getPrePaginatedRowModel().rowsById[id] ?? table.getCoreRowModel().rowsById[id] ?? null
  );
}

export default findRow;
