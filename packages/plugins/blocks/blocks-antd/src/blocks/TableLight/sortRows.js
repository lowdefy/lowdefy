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

import createComparator from '../../table/createComparator.js';

// The rows in the order of `sort` ({ key, desc }), with the column type's
// comparator. Values are read once per row and the sort is stable, so rows
// with equal values keep their data order.
function sortRows({ rows, sort, columnsByKey }) {
  if (sort === null) return rows;
  // A sort on a column that the config no longer declares falls back to the
  // data order; columns can be data, so they can change under a sort.
  const column = columnsByKey[sort.key];
  if (type.isUndefined(column)) return rows;
  const compare = createComparator({ column, desc: sort.desc });
  const values = rows.map((row) => get(row, column.field));
  const order = rows.map((row, index) => index);
  order.sort((a, b) => compare(values[a], values[b]) || a - b);
  return order.map((index) => rows[index]);
}

export default sortRows;
