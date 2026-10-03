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

import type from './type.js';

// An ag-grid `row-index` as a journey target row. Pinned rows (`t-0`, `b-0`) are not zero-based
// integers, so they give null.
function parseRowIndex(value) {
  if (!type.isString(value) || !/^\d+$/.test(value)) {
    return null;
  }
  return Number(value);
}

export default parseRowIndex;
