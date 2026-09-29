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

import countSelectedRows from './countSelectedRows.js';

// The header checkbox state. In client mode it reflects the loaded rows. In server mode it is
// checked only for an `{ all: true }` selection with no exceptions: selecting every loaded row
// is not selecting every row.
function getSelectAllState({ api }) {
  const { selectedCount, total } = countSelectedRows({ api });
  if (!api.config.server) {
    const checked = total > 0 && selectedCount === total;
    return { checked, indeterminate: selectedCount > 0 && !checked };
  }
  if (api.state.selectionMode !== 'all') {
    return { checked: false, indeterminate: selectedCount > 0 };
  }
  const checked = api.selectionExcept.size === 0;
  return { checked, indeterminate: !checked };
}

export default getSelectAllState;
