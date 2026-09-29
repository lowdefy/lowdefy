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

import setChangeField from './setChangeField.js';

// Many cell writes (a paste) folded into one changeset, so they are one value write and one undo
// step. `updates` is [{ rowKey, field, value }]; `dataByKey` maps a row key (as a string) to its
// unchanged data row, and has no entry for rows added in the table.
function applyChangeUpdates({ changes, updates, dataByKey }) {
  return updates.reduce(
    (current, { rowKey, field, value }) =>
      setChangeField({
        changes: current,
        rowKey,
        field,
        value,
        dataRow: dataByKey.get(String(rowKey)),
      }),
    changes
  );
}

export default applyChangeUpdates;
