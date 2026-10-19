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

// Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z (or Ctrl+Y) on TableInput: restores the changeset before (or
// after) the last edit, add, delete, move or paste, as one write with cause `undo` / `redo`.
function createStepHistory(api) {
  return function stepHistory({ direction }) {
    const { editing } = api;
    const current = editing.changes;
    const changes = direction === 'undo' ? editing.undo.undo(current) : editing.undo.redo(current);
    if (changes === null) return false;
    api.actions.cancelEdit({ refocus: false });
    return api.actions.writeChanges({ changes, cause: direction, record: false });
  };
}

export default createStepHistory;
