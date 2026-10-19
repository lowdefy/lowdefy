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
import getKeyId from './getKeyId.js';

// The pending write of one existing row, shared by its `updated` fields and its move, so a
// row that was edited and moved is written by one operation.
function getRowPatch({ rows, key }) {
  const keyId = getKeyId(key);
  let row = rows.get(keyId);
  if (row === undefined) {
    row = { key, patch: new Map() };
    rows.set(keyId, row);
  }
  return row.patch;
}

export default getRowPatch;
