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

// Each display item's top offset in the body, and the body height last (`rows.length + 1`
// entries), for lists whose items are not all one row high: `heightOf(item, index)` gives an
// item's measured height or estimate, undefined for one row.
function computeRowOffsets({ rows, rowHeight, heightOf }) {
  const count = rows.length;
  const offsets = new Float64Array(count + 1);
  let top = 0;
  for (let i = 0; i < count; i++) {
    offsets[i] = top;
    top += heightOf(rows[i], i) ?? rowHeight;
  }
  offsets[count] = top;
  return offsets;
}

export default computeRowOffsets;
