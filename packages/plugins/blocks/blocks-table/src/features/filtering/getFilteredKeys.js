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

import getConditionKeys from './getConditionKeys.js';
import pruneCondition from './pruneCondition.js';

const cache = new WeakMap();
const NONE = new Set();

// The columns a view filter actually constrains (complete conditions only), for the header's
// filter icons. Cached by filter object: every header cell asks on every grid render.
function getFilteredKeys(filter) {
  if (!type.isObject(filter)) return NONE;
  let keys = cache.get(filter);
  if (!keys) {
    keys = getConditionKeys(pruneCondition(filter));
    cache.set(filter, keys);
  }
  return keys;
}

export default getFilteredKeys;
