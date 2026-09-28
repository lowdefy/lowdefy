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

import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';

// Number-family columns (number, currency, percent, progress, rating) are usually all distinct,
// so their keys are read per row without the distinct-value pass.
function isNumericSortType(columnType) {
  return CELL_TYPE_FAMILIES[columnType ?? 'text'] === 'number';
}

export default isNumericSortType;
