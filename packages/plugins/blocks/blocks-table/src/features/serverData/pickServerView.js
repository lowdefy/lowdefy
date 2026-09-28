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

const EMPTY_VIEW = { sort: [], filter: null, search: null, group: [], aggregates: {} };

// The parts of the view the server request reads (D9). The rest (columns, density, ...) never
// changes what the server returns, so it never refetches.
function pickServerView(view) {
  return {
    sort: type.isArray(view.sort) ? view.sort : EMPTY_VIEW.sort,
    filter: view.filter ?? EMPTY_VIEW.filter,
    search: type.isString(view.search) && view.search !== '' ? view.search : EMPTY_VIEW.search,
    group: type.isArray(view.group) ? view.group : EMPTY_VIEW.group,
    aggregates: type.isObject(view.aggregates) ? view.aggregates : EMPTY_VIEW.aggregates,
  };
}

export default pickServerView;
