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

import features from '../features/index.js';

// Stage 3 of the data pipeline (see TableRoot): the rows TanStack sees, after they are diffed by
// key. Each `useRows(ctx)` hook, in registry order, returns the rows the next one sees:
// transactions keep `applyTransaction` results over the rows until the app's data changes, then
// editing lays its optimistic overlay (Table) or its changeset (TableInput) over them, never
// writing `data`. These hooks see rows whose identity only changes when their content does, so
// they can hold state on them. A hook returns its input rows (the same array) when it has nothing
// to add, which keeps every row model memo warm.
function useFeatureRows({ api, config, input, properties, rows }) {
  let result = rows;
  features.forEach((feature) => {
    if (!feature.useRows) return;
    result = feature.useRows({ api, config, input, properties, rows: result });
  });
  return result;
}

export default useFeatureRows;
