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

import initFilter from '../filtering/initFilter.js';
import initSearch from '../filtering/initSearch.js';
import isSelectAllValue from './isSelectAllValue.js';

// The filter and search an `{ all: true }` selection matches: the value's own (written with the
// selection), else the view's (an `{ all: true, except }` set from outside without them).
function initSelectionView({ value, defaultView }) {
  const selected = value?.selected;
  if (!isSelectAllValue(selected)) return null;
  return {
    filter: type.isUndefined(selected.filter)
      ? initFilter({ value, defaultView })
      : selected.filter,
    search: type.isUndefined(selected.search)
      ? initSearch({ value, defaultView })
      : selected.search,
  };
}

export default initSelectionView;
