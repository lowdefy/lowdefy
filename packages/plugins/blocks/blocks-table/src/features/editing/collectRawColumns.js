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

// The leaf column configs as written, by column key (header groups flattened). Editing reads
// `editable: { when }`, `required` and `default` from here: the normalised column model keeps
// only the keys every table feature shares.
function collectRawColumns({ columns, byKey = new Map() }) {
  (columns ?? []).forEach((entry) => {
    const column = type.isString(entry) ? { key: entry } : entry;
    if (!type.isObject(column)) return;
    if (type.isArray(column.children)) {
      collectRawColumns({ columns: column.children, byKey });
      return;
    }
    const key = column.key ?? column.field;
    if (type.isNone(key)) return;
    byKey.set(String(key), column);
  });
  return byKey;
}

export default collectRawColumns;
