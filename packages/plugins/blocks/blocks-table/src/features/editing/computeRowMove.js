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

import { get } from '@lowdefy/helpers';

import positionBetween, { POSITION_STEP } from './positionBetween.js';

// A row move (drag or Alt+Shift+Arrow) on the rows in display order. `gap` is the insertion
// point (0 = before the first row, rows.length = after the last). Returns null when the row
// would land where it is, else
//   { rowKey, fromIndex, toIndex, beforeKey, afterKey, order, position, positions }
// `order` is every key in the new order. With `positionField`, one new position is computed for
// the moved row (fractional indexing), so a save writes one row: `positions` is
// `{ [rowKey]: position }`. Only when there is no room between the neighbours is the whole list
// renumbered in steps of 1024, and `positions` holds every row whose position changed.
function computeRowMove({ rows, getKey, positionField, rowKey, gap }) {
  const from = rows.findIndex((row) => String(getKey(row)) === String(rowKey));
  if (from === -1) return null;
  const clamped = Math.min(Math.max(gap, 0), rows.length);
  const to = clamped > from ? clamped - 1 : clamped;
  if (to === from) return null;
  const moving = rows[from];
  const rest = [...rows.slice(0, from), ...rows.slice(from + 1)];
  const before = rest[to - 1];
  const after = rest[to];
  const arranged = [...rest.slice(0, to), moving, ...rest.slice(to)];
  const move = {
    rowKey: getKey(moving),
    fromIndex: from,
    toIndex: to,
    beforeKey: before === undefined ? null : getKey(before),
    afterKey: after === undefined ? null : getKey(after),
    order: arranged.map(getKey),
    position: undefined,
    positions: undefined,
  };
  if (!positionField) return move;
  const position = positionBetween({
    // A neighbour without a position is null (no room), unlike a missing neighbour.
    before: before === undefined ? undefined : get(before, positionField, { default: null }),
    after: after === undefined ? undefined : get(after, positionField, { default: null }),
  });
  if (position !== null) {
    move.position = position;
    move.positions = { [String(move.rowKey)]: position };
    return move;
  }
  move.positions = {};
  arranged.forEach((row, index) => {
    const renumbered = (index + 1) * POSITION_STEP;
    if (get(row, positionField) !== renumbered) move.positions[String(getKey(row))] = renumbered;
  });
  move.position = (to + 1) * POSITION_STEP;
  return move;
}

export default computeRowMove;
