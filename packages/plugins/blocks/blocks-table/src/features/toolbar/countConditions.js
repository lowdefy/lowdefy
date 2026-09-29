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

// The number of leaf conditions in a filter, for the Filter button's count.
function countConditions(condition) {
  if (!type.isObject(condition)) return 0;
  const group = condition.and ?? condition.or;
  if (type.isArray(group)) {
    return group.reduce((total, child) => total + countConditions(child), 0);
  }
  return 1;
}

export default countConditions;
