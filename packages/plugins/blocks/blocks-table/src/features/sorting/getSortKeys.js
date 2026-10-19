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

import buildSortKeys from './buildSortKeys.js';
import getCachedSortKeys from './getCachedSortKeys.js';
import setCachedSortKeys from './setCachedSortKeys.js';

function getSortKeys({ rows, column }) {
  const cached = getCachedSortKeys({ rows, columnId: column.id });
  if (cached) return cached;
  const { accessor, getSortKey, column: definition } = column.columnDef.meta;
  const keys = buildSortKeys({ rows, accessor, getSortKey, columnType: definition.type });
  setCachedSortKeys({ rows, columnId: column.id, keys });
  return keys;
}

export default getSortKeys;
