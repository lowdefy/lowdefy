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
import { ROW_CONTROLS_KEY } from './rowControlsColumn.js';

const EMPTY = [];

function isEditingCell({ session, rowId, colKey }) {
  return Boolean(session) && session.rowId === rowId && session.colKey === colKey;
}

// The rendered cells the editing layer draws into: the open editor's cell, cells with an edit
// saving or failed and the handle of a row move saving or failed (Table), and cells failing
// inline validation (TableInput). Only cells in the rendered window are found, so the work per
// scroll frame is bounded by the window, and a cell that scrolls back in gets its editor or
// marker again.
function computeEditTargets({ api, session }) {
  const scroller = api.scrollerRef.current;
  const { invalid, moveOverlay, overlay } = api.editing;
  const moveMarked = Boolean(moveOverlay) && moveOverlay.status !== 'saved';
  if (!scroller || (!session && overlay.size === 0 && invalid.size === 0 && !moveMarked)) {
    return EMPTY;
  }
  const targets = [];
  if (session) {
    const element = findCellByKey({ api, rowId: session.rowId, colKey: session.colKey });
    if (element) targets.push({ id: `editor:${session.id}`, kind: 'editor', element });
  }
  overlay.forEach((entry, id) => {
    if (entry.status === 'saved') return;
    if (isEditingCell({ session, rowId: entry.rowKey, colKey: entry.colKey })) return;
    const element = findCellByKey({ api, rowId: entry.rowKey, colKey: entry.colKey });
    if (!element) return;
    targets.push({
      id: `mark:${id}`,
      kind: 'marker',
      element,
      message: entry.message ?? null,
      status: entry.status,
    });
  });
  if (moveMarked) {
    const element = findCellByKey({ api, rowId: moveOverlay.rowKey, colKey: ROW_CONTROLS_KEY });
    if (element) {
      targets.push({
        id: 'move',
        kind: 'marker',
        element,
        message: moveOverlay.message,
        status: moveOverlay.status,
      });
    }
  }
  if (invalid.size > 0) {
    scroller.querySelectorAll('.lf-table-body [data-row-key]').forEach((rowElement) => {
      const rowId = rowElement.dataset.rowKey;
      const cells = invalid.get(rowId);
      if (!cells) return;
      cells.forEach((message, colKey) => {
        if (isEditingCell({ session, rowId, colKey })) return;
        const element = rowElement.querySelector(
          `[data-lf-cell][data-col-key="${CSS.escape(colKey)}"]`
        );
        if (!element) return;
        targets.push({
          id: `invalid:${rowId}\u0000${colKey}`,
          kind: 'marker',
          element,
          message,
          status: 'invalid',
        });
      });
    });
  }
  return targets;
}

export default computeEditTargets;
