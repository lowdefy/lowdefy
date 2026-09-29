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

import getConditionKeys from './getConditionKeys.js';

// A top-level condition belongs to a column's filter when it references that column only. Mixed
// conditions (an `or` across columns from the filter builder) belong to no single column.
function isColumnCondition({ condition, key }) {
  const keys = getConditionKeys(condition);
  return keys.size === 1 && keys.has(key);
}

export default isColumnCondition;
