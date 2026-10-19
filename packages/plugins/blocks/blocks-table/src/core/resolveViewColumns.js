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

import { type } from '@lowdefy/helpers';

import normalizeViewColumn from './normalizeViewColumn.js';

function columnDefaults(column) {
  return { key: column.key, pinned: column.pinned, hidden: column.hidden };
}

// Resolves `view.columns` (order, widths, pinning, visibility) from the value, then
// `defaultView`, then the declared columns. Keys that are no longer declared are dropped.
// Declared columns missing from a stored view (the value) are appended hidden, so a column added
// to config later never pops into a user's saved layout. `defaultView` is config, so its entries
// merge over the column's own defaults and unlisted columns are appended with their defaults.
function resolveViewColumns({ value, defaultView, columns }) {
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const stored = value?.view?.columns;
  const fromDefault = defaultView?.columns;
  let source = null;
  let isStored = false;
  if (type.isArray(stored)) {
    source = stored;
    isStored = true;
  } else if (type.isArray(fromDefault)) {
    source = fromDefault;
  }
  if (source === null) return columns.map(columnDefaults);

  const seen = new Set();
  const resolved = [];
  source.forEach((entry) => {
    if (!type.isObject(entry) || !byKey.has(entry.key) || seen.has(entry.key)) return;
    seen.add(entry.key);
    const fallback = isStored ? null : columnDefaults(byKey.get(entry.key));
    resolved.push(normalizeViewColumn({ entry, fallback }));
  });
  columns.forEach((column) => {
    if (seen.has(column.key)) return;
    resolved.push(isStored ? { key: column.key, hidden: true } : columnDefaults(column));
  });
  return resolved;
}

export default resolveViewColumns;
