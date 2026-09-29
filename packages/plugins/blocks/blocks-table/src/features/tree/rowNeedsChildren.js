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

import { get } from '@lowdefy/helpers';

// With `tree.lazy`, a row needs its children loaded when it is marked with `hasChildrenField` and
// none of its children are in `data` yet. onRowExpand says so (`needsChildren`), so the app loads
// them once, not on every expand.
function rowNeedsChildren({ api, id, row }) {
  const { tree } = api.config;
  if (!tree?.lazy || api.tree === null) return false;
  if (get(row.original, tree.hasChildrenField) !== true) return false;
  return !api.tree.childrenOf.has(id);
}

export default rowNeedsChildren;
