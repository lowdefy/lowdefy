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

import isSelectAllValue from './isSelectAllValue.js';

// Accepts both value shapes: `rowKey[]`, and `{ all: true, except: rowKey[] }` (every loaded row
// except those keys; the shape server mode needs, where not every row is loaded).
function initRowSelection({ value, rows, getKey }) {
  const selected = value?.selected;
  const selection = {};
  if (isSelectAllValue(selected)) {
    const except = new Set((selected.except ?? []).map(String));
    rows.forEach((row) => {
      const id = String(getKey(row));
      if (!except.has(id)) selection[id] = true;
    });
    return selection;
  }
  if (!type.isArray(selected)) return selection;
  selected.forEach((key) => {
    if (!type.isNone(key)) selection[String(key)] = true;
  });
  return selection;
}

export default initRowSelection;
