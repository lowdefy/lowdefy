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

import validateQuickFilters from './validateQuickFilters.js';

const ITEMS = ['views', 'search', 'filter', 'sort', 'group', 'columns', 'density', 'export'];

// The toolbar is off by default (D15). `true` turns on every item; an object turns on the items
// set to true, plus quick filter chips for the listed column keys. A configured toolbar always
// shows the record count.
function normalizeToolbar({ toolbar, columnsByKey }) {
  if (toolbar === true) {
    return Object.fromEntries([
      ...ITEMS.map((item) => [item, true]),
      ['quickFilters', []],
      ['count', true],
    ]);
  }
  if (!type.isObject(toolbar)) return null;
  const normalized = {
    count: true,
    quickFilters: type.isArray(toolbar.quickFilters)
      ? toolbar.quickFilters.filter((key) => type.isString(key))
      : [],
  };
  ITEMS.forEach((item) => {
    normalized[item] = toolbar[item] === true;
  });
  validateQuickFilters({ keys: normalized.quickFilters, columnsByKey });
  return normalized;
}

export default normalizeToolbar;
