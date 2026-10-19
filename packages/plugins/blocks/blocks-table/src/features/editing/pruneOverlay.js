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

// Drops settled overlay entries (saved or failed) whose row changed in `data` or left it. An edit
// still saving stays: its result decides. Returns `overlay` itself when nothing was dropped, so a
// data change with nothing to prune does not re-render.
function pruneOverlay({ overlay, rows, getKey }) {
  if (overlay.size === 0) return overlay;
  const wanted = new Set();
  overlay.forEach((entry) => {
    if (entry.status !== 'saving') wanted.add(entry.rowKey);
  });
  if (wanted.size === 0) return overlay;
  const current = new Map();
  rows.forEach((row) => {
    const key = String(getKey(row));
    if (wanted.has(key)) current.set(key, row);
  });
  let next = overlay;
  overlay.forEach((entry, id) => {
    if (entry.status === 'saving') return;
    if (current.get(entry.rowKey) === entry.source) return;
    if (next === overlay) next = new Map(overlay);
    next.delete(id);
  });
  return next;
}

export default pruneOverlay;
