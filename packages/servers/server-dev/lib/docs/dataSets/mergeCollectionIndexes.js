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

function keyOf(index) {
  return JSON.stringify(index.key);
}

// The indexes one collection is created with, from every connection the data set loads into it,
// where a later index whose key equals an earlier one replaces it. expireAfterSeconds is
// dropped, so a TTL index becomes a plain one: fixtures often carry old dates, and the TTL monitor
// would delete them on its own clock, making a run depend on when it happened.
function mergeCollectionIndexes({ dataSetName, collection, indexes }) {
  const byKey = new Map();
  indexes.forEach((index) => {
    byKey.set(keyOf(index), index);
  });
  const byName = new Map();
  const merged = [...byKey.values()].map((index) => {
    const { expireAfterSeconds, v, ns, ...rest } = index;
    return rest;
  });
  merged.forEach((index) => {
    if (type.isUndefined(index.name)) return;
    const other = byName.get(index.name);
    if (!type.isUndefined(other)) {
      throw new Error(
        `Data set "${dataSetName}" collection "${collection}" has two indexes named "${
          index.name
        }" with different keys: ${keyOf(other)} and ${keyOf(index)}.`
      );
    }
    byName.set(index.name, index);
  });
  return merged;
}

export default mergeCollectionIndexes;
