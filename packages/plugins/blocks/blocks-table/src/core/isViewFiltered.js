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

import countConditions from '../features/toolbar/countConditions.js';

// Whether the view filters rows out: a filter condition or a search is set. An empty table under
// a filtered view says "No matching rows" and offers to clear them, instead of "No rows".
function isViewFiltered(state) {
  if (type.isString(state.search) && state.search.trim() !== '') return true;
  return countConditions(state.filter) > 0;
}

export default isViewFiltered;
