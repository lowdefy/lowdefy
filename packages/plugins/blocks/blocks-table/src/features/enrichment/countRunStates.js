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

import { get, type } from '@lowdefy/helpers';

// Run state counts of a column over rows (the header progress chip): `{ queued, running, ok,
// error, empty }`. Stale cells are not counted: that needs every row's inputs hashed.
function countRunStates({ rows, column }) {
  const counts = { queued: 0, running: 0, ok: 0, error: 0, empty: 0 };
  for (let i = 0; i < rows.length; i++) {
    const status = get(rows[i], column.stateField)?.status;
    if (type.isNumber(counts[status])) counts[status] += 1;
  }
  return counts;
}

export default countRunStates;
