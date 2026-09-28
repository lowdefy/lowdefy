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

// A TableInput cell edit: the field goes into the changeset under the row's key.
function createWriteCell(api) {
  return function writeCell({ rowKey, field, value }) {
    const { editing } = api;
    const changes = setChangeField({
      changes: editing.changes,
      rowKey,
      field,
      value,
      dataRow: editing.getDataByKey().get(String(rowKey)),
    });
    return api.actions.writeChanges({ changes, cause: 'edit', rowKey });
  };
}

export default createWriteCell;
