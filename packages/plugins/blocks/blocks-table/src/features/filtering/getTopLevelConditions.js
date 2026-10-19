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

// The conditions a view filter combines at the top: the items of a top-level `and`, or the filter
// itself as the only item (a leaf or an `or` group).
function getTopLevelConditions(filter) {
  if (!type.isObject(filter)) return [];
  if (type.isArray(filter.and)) return filter.and;
  return [filter];
}

export default getTopLevelConditions;
