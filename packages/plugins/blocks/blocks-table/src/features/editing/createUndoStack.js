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

// A bounded undo history of whole rows arrays. Snapshots are cheap: writes are immutable, so
// consecutive snapshots share every row they did not change. An entry only applies while the
// value is still the one it produced; a value changed from outside (SetState, Reset, a refetch)
// makes the history stale, and it is cleared rather than replayed over the new value.
function createUndoStack({ limit = 100 } = {}) {
  let past = [];
  let future = [];

  function clear() {
    past = [];
    future = [];
  }

  function push({ before, after }) {
    past.push({ before, after });
    if (past.length > limit) past = past.slice(past.length - limit);
    future = [];
  }

  function undo(current) {
    const entry = past.pop();
    if (!entry) return null;
    if (entry.after !== current) {
      clear();
      return null;
    }
    future.push(entry);
    return entry.before;
  }

  function redo(current) {
    const entry = future.pop();
    if (!entry) return null;
    if (entry.before !== current) {
      clear();
      return null;
    }
    past.push(entry);
    return entry.after;
  }

  return {
    clear,
    push,
    redo,
    undo,
    get size() {
      return { past: past.length, future: future.length };
    },
  };
}

export default createUndoStack;
