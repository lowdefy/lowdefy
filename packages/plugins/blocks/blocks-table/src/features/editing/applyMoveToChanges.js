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

import { get, serializer, set } from '@lowdefy/helpers';

function applyPositions({ changes, positions, positionField, dataByKey }) {
  const moved = { ...(changes.moved ?? {}) };
  let added = changes.added;
  Object.entries(positions).forEach(([key, position]) => {
    const addedIndex = added.findIndex((entry) => String(entry.rowKey) === key);
    if (addedIndex !== -1) {
      // An added row carries its position in its own entry, like its other fields.
      added = added.slice();
      const entry = serializer.copy(added[addedIndex]);
      set(entry, positionField, position);
      added[addedIndex] = entry;
      return;
    }
    const dataRow = dataByKey.get(key);
    if (dataRow !== undefined && get(dataRow, positionField) === position) {
      delete moved[key];
    } else {
      moved[key] = position;
    }
  });
  const next = { ...changes, added };
  if (Object.keys(moved).length > 0) {
    next.moved = moved;
  } else {
    delete next.moved;
  }
  return next;
}

// A TableInput row move as a new changeset. With `positionField` the new positions go in
// `moved` (a data row moved back to its original position leaves it); without one, `order`
// records the full key order.
function applyMoveToChanges({ changes, move, positionField, dataByKey }) {
  if (positionField) {
    return applyPositions({ changes, positions: move.positions, positionField, dataByKey });
  }
  return { ...changes, order: move.order };
}

export default applyMoveToChanges;
