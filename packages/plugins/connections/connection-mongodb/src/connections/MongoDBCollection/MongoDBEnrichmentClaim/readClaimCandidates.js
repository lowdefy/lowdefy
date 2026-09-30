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

import andConditions from '../enrichment/andConditions.js';
import getClaimableCondition from '../enrichment/getClaimableCondition.js';
import scopeReadFilter from '../enrichment/scopeReadFilter.js';

function queuedTime({ doc, target }) {
  const queuedAt = get(doc, target.paths.queuedAt, { default: null });
  return queuedAt instanceof Date ? queuedAt.getTime() : 0;
}

// The oldest claimable cells, at most `count`: per column, one find of its claimable cells
// sorted by queuedAt (an index on { "_enrich.<key>.status": 1, "_enrich.<key>.queuedAt": 1 }
// serves it), leaving out the cells this claim already tried, then the oldest of all columns.
async function readClaimCandidates({ collection, compiled, count, now, tenant, tried }) {
  const { filter, rowKeyField, targets } = compiled;
  const hasRowKey = rowKeyField === '_id' ? null : { [rowKeyField]: { $exists: true, $ne: null } };
  const candidates = [];
  for (const target of targets) {
    const triedIds = tried.get(target.columnKey) ?? [];
    const docs = await collection
      .find(
        scopeReadFilter({
          filter: andConditions([
            filter,
            hasRowKey,
            getClaimableCondition({ columnKey: target.columnKey, now }),
            triedIds.length === 0 ? null : { _id: { $nin: triedIds } },
          ]),
          tenant,
        }),
        {
          projection: target.projection,
          sort: { [target.paths.queuedAt]: 1, _id: 1 },
          limit: count,
        }
      )
      .toArray();
    docs.forEach((doc) => {
      candidates.push({ doc, target, queuedAt: queuedTime({ doc, target }) });
    });
  }
  return candidates.sort((first, second) => first.queuedAt - second.queuedAt).slice(0, count);
}

export default readClaimCandidates;
