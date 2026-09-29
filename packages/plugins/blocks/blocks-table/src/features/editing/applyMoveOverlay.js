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

import { serializer, set } from '@lowdefy/helpers';

import reorderByKeys from './reorderByKeys.js';
import sortByPosition from './sortByPosition.js';

// Table's optimistic row move (the onRowMove cycle, like onCellEdit's overlay): while the event
// runs, and after it succeeded until `data` changes, the rows show in the moved order. With a
// position field the moved rows get their new positions (on copies) and the rows are ordered by
// it; without one they follow the move's key order. `data` is the array the move was made on.
// Copies are mapped to their data rows in `sources`, as the cell overlay's are.
function applyMoveOverlay({ rows, move, data, getKey, positionField, sources }) {
  if (!move || !move.hasValue) return rows;
  if (move.status !== 'saving' && move.source !== data) return rows;
  if (!positionField) return reorderByKeys({ rows, order: move.order, getKey });
  const positioned = rows.map((row) => {
    const position = move.positions[String(getKey(row))];
    if (position === undefined) return row;
    const copy = serializer.copy(row);
    set(copy, positionField, position);
    sources.set(copy, sources.get(row) ?? row);
    return copy;
  });
  return sortByPosition({ rows: positioned, positionField });
}

export default applyMoveOverlay;
