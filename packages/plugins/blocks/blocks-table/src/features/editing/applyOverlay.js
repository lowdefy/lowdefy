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

// The optimistic overlay (D8) over `data`: rows with an edit that is saving, or saved and not yet
// replaced by new data, are shown as copies with the edited values in. `data` itself is never
// written. A saved edit stops applying once its row in `data` is a different object than the one
// it was made on: the data has caught up (or moved on). `sources` maps each copy back to its data
// row, so the next edit of the same row records the data row, not the copy.
function applyOverlay({ rows, overlay, getKey, sources }) {
  if (overlay.size === 0) return rows;
  const byRow = new Map();
  overlay.forEach((entry) => {
    if (!entry.hasValue) return;
    if (!byRow.has(entry.rowKey)) byRow.set(entry.rowKey, []);
    byRow.get(entry.rowKey).push(entry);
  });
  if (byRow.size === 0) return rows;
  return rows.map((row) => {
    const entries = byRow.get(String(getKey(row)));
    if (!entries) return row;
    const live = entries.filter((entry) => entry.status === 'saving' || entry.source === row);
    if (live.length === 0) return row;
    const copy = serializer.copy(row);
    live.forEach((entry) => set(copy, entry.field, serializer.copy(entry.value)));
    sources.set(copy, row);
    return copy;
  });
}

export default applyOverlay;
