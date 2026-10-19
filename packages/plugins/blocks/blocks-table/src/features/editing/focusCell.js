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

import findCellByKey from './findCellByKey.js';

// Returns keyboard focus to a cell after its editor closes; the keyboard feature's focus handler
// makes it the active cell again, so arrows continue from where the edit was.
function focusCell({ api, rowId, colKey }) {
  const cell = findCellByKey({ api, rowId, colKey });
  cell?.focus({ preventScroll: true });
}

export default focusCell;
