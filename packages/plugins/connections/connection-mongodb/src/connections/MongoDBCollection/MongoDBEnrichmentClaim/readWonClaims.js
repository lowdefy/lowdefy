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

import buildProjection from '../enrichment/buildProjection.js';
import scopeReadFilter from '../enrichment/scopeReadFilter.js';

// The claims this worker won, when fewer cells changed than it wrote: another worker's claim
// matched first. Each claim token is random, so a cell holding this worker's token is one it
// won; the others it lost.
async function readWonClaims({ collection, cells, tenant }) {
  const ids = [...new Map(cells.map((cell) => [String(cell.docId), cell.docId])).values()];
  const docs = await collection
    .find(scopeReadFilter({ filter: { _id: { $in: ids } }, tenant }), {
      projection: buildProjection(['_id', ...cells.map((cell) => cell.tokenPath)]),
    })
    .toArray();
  const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
  return cells.filter((cell) => {
    const doc = docsById.get(String(cell.docId));
    return (
      doc !== undefined && get(doc, cell.tokenPath, { default: null }) === cell.claim.claimToken
    );
  });
}

export default readWonClaims;
