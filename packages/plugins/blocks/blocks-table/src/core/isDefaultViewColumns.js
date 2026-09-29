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

import resolveViewColumns from './resolveViewColumns.js';

function comparable(entry) {
  return [entry.key, entry.width ?? null, entry.pinned ?? null, entry.hidden === true];
}

// A view whose columns still match the configured layout leaves `columns` out, so it keeps
// following config: a column added to config later (or `columns` loaded from a request) shows
// up, instead of being appended hidden as it is for a layout the user changed.
function isDefaultViewColumns({ entries, config }) {
  const defaults = resolveViewColumns({
    value: null,
    defaultView: config.defaultView,
    columns: config.columns,
  });
  if (defaults.length !== entries.length) return false;
  return JSON.stringify(entries.map(comparable)) === JSON.stringify(defaults.map(comparable));
}

export default isDefaultViewColumns;
