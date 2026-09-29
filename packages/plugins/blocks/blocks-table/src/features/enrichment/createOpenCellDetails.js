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

import setUi from './setUi.js';

// Action `openCellDetails({ rowId, key })` and block method `openCellDetails({ rowKey, key })`:
// opens the cell details panel for an enrichment, ai or extract cell of a loaded row.
function createOpenCellDetails(api) {
  return function openCellDetails({ rowId, rowKey, key }) {
    const id = rowId ?? String(rowKey);
    if (!api.config.enrichment.detailColumns.has(key) || !api.table.getRow(id, true)) return false;
    setUi({ api, patch: { details: { rowId: id, key } } });
    return true;
  };
}

export default createOpenCellDetails;
