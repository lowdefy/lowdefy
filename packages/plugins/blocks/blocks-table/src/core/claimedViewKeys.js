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

// View keys with an owner. `columns` and `density` belong to the core; the rest of the view (filter,
// search, group, ...) passes through unchanged until a feature module claims it.
const claimedViewKeys = new Set(['columns', 'density']);
features.forEach((feature) => {
  (feature.viewKeys ?? []).forEach((key) => claimedViewKeys.add(key));
});

export default claimedViewKeys;
