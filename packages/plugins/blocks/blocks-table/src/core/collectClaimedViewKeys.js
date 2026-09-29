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

// View keys with an owner. `columns` belongs to the core; the rest of the view (filter, search,
// ...) passes through unchanged until a feature module claims it.
function collectClaimedViewKeys(features) {
  const keys = new Set(['columns']);
  features.forEach((feature) => {
    (feature.viewKeys ?? []).forEach((key) => keys.add(key));
  });
  return keys;
}

export default collectClaimedViewKeys;
