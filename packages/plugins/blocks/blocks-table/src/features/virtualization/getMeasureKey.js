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

import isDataItem from '../../core/isDataItem.js';

// The key a display item's measured height is cached under (its element's `data-measure-key`):
// the row id for data rows, `kind:key` for other items, null for a row that is not loaded yet.
function getMeasureKey(item) {
  if (item === undefined) return null;
  if (isDataItem(item)) return item.id;
  return `${item.kind}:${item.key}`;
}

export default getMeasureKey;
