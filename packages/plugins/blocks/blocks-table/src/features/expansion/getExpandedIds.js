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

const cache = new WeakMap();

// The expanded row keys as a set of row ids (TanStack ids are strings), cached per `expanded`
// array so every lookup in a render shares one set.
function getExpandedIds(expanded) {
  let ids = cache.get(expanded);
  if (!ids) {
    ids = new Set(expanded.map(String));
    cache.set(expanded, ids);
  }
  return ids;
}

export default getExpandedIds;
