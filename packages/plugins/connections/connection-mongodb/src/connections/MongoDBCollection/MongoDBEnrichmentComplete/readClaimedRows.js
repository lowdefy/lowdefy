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

import getKeyId from '../MongoDBTableChanges/getKeyId.js';
import andConditions from '../enrichment/andConditions.js';
import buildProjection from '../enrichment/buildProjection.js';
import enrichPath from '../enrichment/enrichPath.js';
import scopeReadFilter from '../enrichment/scopeReadFilter.js';

function holdsClaim({ doc, result }) {
  const { columnKey, claimToken } = result;
  return (
    get(doc, enrichPath({ columnKey, property: 'claimToken' }), { default: null }) === claimToken &&
    get(doc, enrichPath({ columnKey, property: 'status' }), { default: null }) === 'running'
  );
}

// The row each result's claim is on, read before the write inside the base filter and the
// tenant, with the claim's token, status and attempts. A result whose claim no row holds
// (another worker claimed the cell since, or it is not in scope) is ignored.
async function readClaimedRows({ collection, compiled, tenant }) {
  const { filter, results, rowKeyField } = compiled;
  const columnKeys = [...new Set(results.map((result) => result.columnKey))];
  const docs = await collection
    .find(
      scopeReadFilter({
        filter: andConditions([
          filter,
          { [rowKeyField]: { $in: results.flatMap((result) => result.keyForms) } },
        ]),
        tenant,
      }),
      {
        projection: buildProjection([
          '_id',
          rowKeyField,
          ...columnKeys.flatMap((columnKey) => [
            enrichPath({ columnKey, property: 'claimToken' }),
            enrichPath({ columnKey, property: 'status' }),
            enrichPath({ columnKey, property: 'attempts' }),
          ]),
        ]),
      }
    )
    .toArray();
  const docsByKeyId = new Map();
  docs.forEach((doc) => {
    const keyId = getKeyId(get(doc, rowKeyField));
    docsByKeyId.set(keyId, [...(docsByKeyId.get(keyId) ?? []), doc]);
  });
  return results.map((result) => {
    const candidates = result.keyForms.flatMap((form) => docsByKeyId.get(getKeyId(form)) ?? []);
    return candidates.find((doc) => holdsClaim({ doc, result })) ?? null;
  });
}

export default readClaimedRows;
