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

import resolveTagTone from '@lowdefy/block-utils/format/resolveTagTone.js';
import seededTagColor from '@lowdefy/block-utils/format/seededTagColor.js';
import { get, type } from '@lowdefy/helpers';

import resolveOption from './resolveOption.js';

// The tone of a tag or status value (`resolveTagTone`): its colour, for the status dot, and the
// tag's text, fill and border colours. A matching option's
// colour wins (an option without one is neutral). Without an option the
// ag-grid tag keys apply: `colorFrom` (a row path), then `colorMap`, then
// `default`; a column that sets none of them colours each value from a stable
// hash, so the same value always gets the same colour.
function getTagTone({ item, column, row }) {
  const { cell } = column;
  const option = resolveOption({ options: column.options, value: item });
  if (!type.isUndefined(option)) {
    return resolveTagTone(option.color ?? 'default');
  }
  let color;
  if (type.isString(cell.colorFrom)) {
    color = get(row, cell.colorFrom);
  } else if (type.isObject(cell.colorMap)) {
    color = cell.colorMap[item];
  }
  color = color ?? cell.default;
  const seeded =
    type.isNone(cell.colorFrom) && type.isNone(cell.colorMap) && type.isNone(cell.default);
  if (type.isNone(color) && seeded) color = seededTagColor(item);
  return resolveTagTone(color ?? 'default');
}

export default getTagTone;
