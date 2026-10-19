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

// Without `preserve`, keys of rows that are no longer in `data` are dropped on the next selection
// change (antd's behaviour without preserveSelectedRowKeys), not the moment data changes.
function pruneRowSelection({ next, api }) {
  if (api.config.rowSelection?.preserve === true) return next;
  const rowsById = api.table.getCoreRowModel().rowsById;
  const pruned = {};
  Object.keys(next).forEach((id) => {
    if (next[id] === true && rowsById[id]) pruned[id] = true;
  });
  return pruned;
}

export default pruneRowSelection;
