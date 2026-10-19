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

// Rows in `positionField` order, for showing moved rows where their new position puts them.
// Stable, so rows with equal or missing positions keep their data order (missing last).
function sortByPosition({ rows, positionField }) {
  return rows
    .map((row, index) => ({ row, index, position: get(row, positionField) }))
    .sort((a, b) => {
      const aNumber = type.isNumber(a.position);
      const bNumber = type.isNumber(b.position);
      if (aNumber && bNumber && a.position !== b.position) return a.position - b.position;
      if (aNumber !== bNumber) return aNumber ? -1 : 1;
      return a.index - b.index;
    })
    .map((item) => item.row);
}

export default sortByPosition;
