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

import getViewKey from './getViewKey.js';

// Saved views `[{ id, title, view, shared, locked, count }]` from any source. Views often come
// from a request, so a list that has not loaded yet (null) is an empty list. `key` is the id as a
// string (getViewKey), for tabs and lookups; events carry the id as the app gave it.
function normalizeViews(views) {
  if (!type.isArray(views)) return [];
  const seen = new Set();
  const normalized = [];
  views.forEach((entry) => {
    if (!type.isObject(entry) || type.isNone(entry.id)) return;
    const key = getViewKey(entry.id);
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({
      id: entry.id,
      key,
      title: type.isNone(entry.title) ? key : String(entry.title),
      view: type.isObject(entry.view) ? entry.view : {},
      shared: entry.shared === true,
      locked: entry.locked === true,
      count: type.isNumber(entry.count) ? entry.count : undefined,
    });
  });
  return normalized;
}

export default normalizeViews;
