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

// The conditions ANDed at the top of a filter: the items of a root `and` group, or the filter
// itself when it is a single leaf or an `or` group.
function getRootConditions(filter) {
  if (!type.isObject(filter)) return [];
  if (type.isArray(filter.and)) return filter.and;
  return [filter];
}

export default getRootConditions;
