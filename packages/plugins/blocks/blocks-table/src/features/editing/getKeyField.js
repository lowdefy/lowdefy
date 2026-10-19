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

import { get, type } from '@lowdefy/helpers';

// The field that holds a row's key, where an added row shows its temporary key: `rowKey`, else
// the default key field the data uses (`_id` before `id`, as the row key getter reads them).
function getKeyField({ rowKey, rows }) {
  if (type.isString(rowKey)) return rowKey;
  if ((rows ?? []).some((row) => !type.isNone(get(row, '_id')))) return '_id';
  return 'id';
}

export default getKeyField;
