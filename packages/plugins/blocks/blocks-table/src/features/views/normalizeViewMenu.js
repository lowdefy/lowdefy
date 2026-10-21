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

// The `viewMenu` items `[{ key, label, danger, confirm }]`, or null when the block sets none and
// the tab menu keeps its default Delete view. `confirm` is false, true (ask with a default
// message) or the message to ask.
function normalizeViewMenu(viewMenu) {
  if (!type.isArray(viewMenu)) return null;
  const seen = new Set();
  const items = [];
  viewMenu.forEach((entry) => {
    if (!type.isObject(entry) || !type.isString(entry.key) || seen.has(entry.key)) return;
    seen.add(entry.key);
    items.push({
      key: entry.key,
      label: type.isNone(entry.label) ? entry.key : String(entry.label),
      danger: entry.danger === true,
      confirm: type.isString(entry.confirm) || entry.confirm === true ? entry.confirm : false,
    });
  });
  return items;
}

export default normalizeViewMenu;
