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

import viewKeys from './viewKeys.js';

const KNOWN_KEYS = new Set(viewKeys);

// A stored view comes from an older config or a hand-edited URL. The brief's fallback rules apply:
// unknown view keys are dropped, column entries for columns that no longer exist are dropped, and
// declared columns missing from a stored column layout are appended hidden. A view without
// `columns` keeps following the configured layout.
function sanitizePersistedView({ view, columnKeys }) {
  if (!type.isObject(view)) return null;
  const sanitized = {};
  Object.keys(view).forEach((key) => {
    if (KNOWN_KEYS.has(key)) sanitized[key] = view[key];
  });
  if (!type.isArray(view.columns)) {
    delete sanitized.columns;
    return sanitized;
  }
  const declared = new Set(columnKeys);
  const seen = new Set();
  const columns = [];
  view.columns.forEach((entry) => {
    if (!type.isObject(entry) || !declared.has(entry.key) || seen.has(entry.key)) return;
    seen.add(entry.key);
    columns.push(entry);
  });
  columnKeys.forEach((key) => {
    if (!seen.has(key)) columns.push({ key, hidden: true });
  });
  sanitized.columns = columns;
  return sanitized;
}

export default sanitizePersistedView;
