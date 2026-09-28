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

// The rows handed to TanStack after they are diffed by key: a feature's `useRows(ctx)` hook may
// replace them in registry order. Unlike `useData`, it sees rows whose identity only changes when
// their content does, so it can hold state on them (`applyTransaction` keeps its changes until
// the app's data changes).
function useFeatureRows({ api, config, rows }) {
  let result = rows;
  features.forEach((feature) => {
    if (!feature.useRows) return;
    result = feature.useRows({ api, config, rows: result });
  });
  return result;
}

export default useFeatureRows;
