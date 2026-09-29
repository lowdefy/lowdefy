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

import isServerMode from './isServerMode.js';

// Row-model inputs that come from config rather than state: the columns conditions and search
// read, and the user `{ $user: path }` values resolve from. In server mode the request filters,
// so TanStack's filtered row model passes the rows through.
function getFilteringTableOptions({ config }) {
  const columnsByKey = {};
  config.columns.forEach((column) => {
    columnsByKey[column.key] = column;
  });
  return {
    manualFiltering: isServerMode(config),
    lowdefyFiltering: { columns: config.columns, columnsByKey, user: config.user },
  };
}

export default getFilteringTableOptions;
