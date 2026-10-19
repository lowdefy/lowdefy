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

// The `index` of row events (onRowClick, onRowDoubleClick). Client data: the row's index in
// `data` (with `childrenField`, in the depth-first list of every node). Server mode: the row's
// index on the server in its list (the root list, or its group's), its block's startRow plus its
// place in the block. Rows that are not in `data`, added by applyTransaction or in a TableInput,
// have no index: null.
function getRowIndex({ api, rowKey }) {
  if (api.serverStore) return api.serverStore.getRowIndex(rowKey);
  return api.getSourceIndex(rowKey);
}

export default getRowIndex;
