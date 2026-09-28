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

import getTopLevelConditions from './getTopLevelConditions.js';
import isColumnCondition from './isColumnCondition.js';

// Replaces one column's conditions in a view filter. The filter is a top-level `and`: the
// column's existing conditions are removed and `condition` (a leaf or a group; the items of an
// `and` group are spread) takes the place of the first of them, so editing a column filter keeps
// its position. Conditions that mix columns are kept. No conditions left means no filter (null).
function setColumnFilter({ filter, key, condition }) {
  const existing = getTopLevelConditions(filter);
  let added = [];
  if (type.isObject(condition)) {
    added = type.isArray(condition.and) ? condition.and : [condition];
  }
  const items = [];
  let inserted = false;
  existing.forEach((item) => {
    if (!isColumnCondition({ condition: item, key })) {
      items.push(item);
      return;
    }
    if (!inserted) {
      items.push(...added);
      inserted = true;
    }
  });
  if (!inserted) items.push(...added);
  if (items.length === 0) return null;
  return { and: items };
}

export default setColumnFilter;
