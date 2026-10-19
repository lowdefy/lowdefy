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

import { useMemo } from 'react';

import flattenTreeData from './flattenTreeData.js';

// Nested `childrenField` rows are flattened before TanStack sees them; `parentField` rows are
// already flat. The parents found while flattening feed the tree index (useTreeItems).
function useTreeData({ api, config, data }) {
  const childrenField = config.tree?.childrenField ?? null;
  const flattened = useMemo(
    () => (childrenField ? flattenTreeData({ data, childrenField, getId: config.getId }) : null),
    [data, childrenField, config.getId]
  );
  api.treeParents = flattened?.parentOf ?? null;
  return flattened ? flattened.rows : data;
}

export default useTreeData;
