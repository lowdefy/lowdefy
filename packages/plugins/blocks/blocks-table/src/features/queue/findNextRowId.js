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

import isDataItem from '../../core/isDataItem.js';

// The id of the data row after this one in the display list (group headers, detail rows and rows
// not loaded yet skipped), or null.
function findNextRowId({ rows, id }) {
  const index = rows.findIndex((row) => isDataItem(row) && row.id === id);
  if (index === -1) return null;
  for (let i = index + 1; i < rows.length; i++) {
    if (isDataItem(rows[i])) return rows[i].id;
  }
  return null;
}

export default findNextRowId;
