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

// Feature hooks on the table's rows, between the stabilised data and TanStack, in registry order.
// Each `useData(ctx)` returns the rows the next one (and the table) sees: editing lays its
// optimistic overlay over `data` here without writing `data`. A hook must return its input rows
// unchanged (same array) when it has nothing to add, which keeps every row model memo warm.
function useFeatureData(ctx) {
  let { data } = ctx;
  features.forEach((feature) => {
    if (!feature.useData) return;
    data = feature.useData({ ...ctx, data });
  });
  return data;
}

export default useFeatureData;
