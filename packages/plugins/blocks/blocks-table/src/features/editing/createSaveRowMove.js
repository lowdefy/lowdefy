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

import getEventError from './getEventError.js';
import warnMissingEvent from './warnMissingEvent.js';

// Keeps the positions of an earlier move that still shows (saving, or saved on the same data),
// so two quick moves before a refetch both stay in place.
function mergePositions({ previous, data, positions }) {
  if (!previous?.hasValue) return positions;
  if (previous.status !== 'saving' && previous.source !== data) return positions;
  return { ...previous.positions, ...positions };
}

// Table's row move lifecycle, the same cycle as a cell edit: the rows reorder at once (an
// overlay over `data`) with a saving marker on the moved row's handle while onRowMove runs; on
// success the order stays until `data` changes, on failure it reverts and the handle shows the
// error message. The event carries everything a save needs: the neighbours' keys, and with a
// position field the new position (normally of the moved row only).
function createSaveRowMove(api) {
  return async function saveRowMove({ move, row }) {
    const { editing } = api;
    const token = {};
    const source = editing.data;
    editing.setMoveOverlay((previous) => ({
      hasValue: true,
      message: null,
      order: move.order,
      positions: mergePositions({ previous, data: source, positions: move.positions ?? {} }),
      rowKey: String(move.rowKey),
      source,
      status: api.events.onRowMove ? 'saving' : 'saved',
      token,
    }));
    if (!api.events.onRowMove) {
      warnMissingEvent({ api, name: 'onRowMove', what: 'row moves' });
      return;
    }
    const result = await api.methods.triggerEvent({
      name: 'onRowMove',
      event: {
        row,
        rowKey: move.rowKey,
        fromIndex: move.fromIndex,
        toIndex: move.toIndex,
        beforeKey: move.beforeKey,
        afterKey: move.afterKey,
        position: move.position,
        positions: move.positions,
      },
    });
    const message = getEventError(result);
    editing.setMoveOverlay((current) => {
      if (!current || current.token !== token) return current;
      if (message !== null) return { ...current, hasValue: false, message, status: 'error' };
      // The data already changed while the event ran (the event wrote it): it holds the move.
      if (editing.data !== current.source) return null;
      return { ...current, status: 'saved' };
    });
  };
}

export default createSaveRowMove;
