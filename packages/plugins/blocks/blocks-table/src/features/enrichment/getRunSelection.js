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

// The rows a column run covers (onColumnRun `selection`): the table's selection value when rows
// are selected (row keys, or `{ all: true, except, filter, search }`), otherwise every row of
// the current view, `{ all: true, except: [], filter, search }` with the view's filter and search,
// the shape the enqueue request resolves on the server.
function getRunSelection({ api }) {
  const { selected, view } = api.getValue();
  if (type.isObject(selected)) return selected;
  if (type.isArray(selected) && selected.length > 0) return selected;
  return { all: true, except: [], filter: view?.filter ?? null, search: view?.search ?? null };
}

export default getRunSelection;
