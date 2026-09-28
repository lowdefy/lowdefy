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

function setEntry({ api, id, entry }) {
  api.editing.setOverlay((previous) => {
    const next = new Map(previous);
    next.set(id, entry);
    return next;
  });
}

function findDataRow({ api, rowKey }) {
  return api.editing.getDataByKey().get(String(rowKey));
}

// Table's edit lifecycle (D8). The new value shows at once, as an overlay entry keyed by row key
// and column key (never written into `data`), marked saving while onCellEdit runs. The event
// result decides: on success the entry stays until the row changes in `data` (the app's refetch
// or SetState lands), then it is dropped; on failure the value reverts and the cell shows an
// error marker with the action's message. A later edit of the same cell supersedes an earlier
// one still saving: the earlier result is ignored.
function createSaveCellEdit(api) {
  return async function saveCellEdit({ row, rowKey, spec, value, previous }) {
    const id = `${String(rowKey)}\u0000${spec.key}`;
    const token = {};
    const base = {
      colKey: spec.key,
      field: spec.field,
      rowKey: String(rowKey),
      source: api.editing.sources.get(row) ?? row,
      token,
      value,
    };
    if (!api.events.onCellEdit) {
      warnMissingEvent({ api, name: 'onCellEdit', what: 'cell edits' });
      setEntry({ api, id, entry: { ...base, hasValue: true, status: 'saved' } });
      return;
    }
    setEntry({ api, id, entry: { ...base, hasValue: true, status: 'saving' } });
    const result = await api.methods.triggerEvent({
      name: 'onCellEdit',
      event: { row, rowKey, column: { key: spec.key, field: spec.field }, value, previous },
    });
    const message = getEventError(result);
    const settledSource = findDataRow({ api, rowKey });
    api.editing.setOverlay((current) => {
      const entry = current.get(id);
      if (!entry || entry.token !== token) return current;
      const next = new Map(current);
      if (message !== null) {
        next.set(id, { ...entry, hasValue: false, message, status: 'error' });
      } else if (settledSource !== entry.source) {
        // The data already changed while the event ran (the event wrote it): it holds the edit.
        next.delete(id);
      } else {
        next.set(id, { ...entry, status: 'saved' });
      }
      return next;
    });
  };
}

export default createSaveCellEdit;
