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

import { type } from '@lowdefy/helpers';

// The number of selected rows. With `{ all: true, except }` and a server total, every row the
// server matches is selected except the loaded rows that were unchecked; otherwise it is the
// selected keys (with `preserve`, including rows that are not loaded).
function countSelection({ api, state }) {
  let selected = 0;
  Object.values(state.rowSelection).forEach((isSelected) => {
    if (isSelected === true) selected += 1;
  });
  if (state.selectionMode !== 'all' || !type.isNumber(api.total)) return selected;
  const loaded = api.table.getCoreRowModel().rows.length;
  return api.total - (loaded - selected);
}

export default countSelection;
