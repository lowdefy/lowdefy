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

import moveKeys from '../ordering/moveKeys.js';

// The column state for a reordered manager list: visible columns take the view-order slots they
// already held in their new order (hidden columns keep theirs), and the pinned regions follow the
// boundaries. Hidden pinned columns stay pinned.
function applyManagerRegions({ state, regions }) {
  const { columnOrder, columnPinning, columnVisibility } = state;
  const isHidden = (key) => columnVisibility[key] === false;
  return {
    columnOrder: moveKeys({
      order: columnOrder,
      sequence: [...regions.start, ...regions.center, ...regions.end],
    }),
    columnPinning: {
      start: [...columnPinning.start.filter(isHidden), ...regions.start],
      end: [...regions.end, ...columnPinning.end.filter(isHidden)],
    },
  };
}

export default applyManagerRegions;
