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

import getEnrichmentLogOrganization from '../enrichment/getEnrichmentLogOrganization.js';
import runBulkWriteBatches from '../enrichment/runBulkWriteBatches.js';
import scopeWriteOperations from '../enrichment/scopeWriteOperations.js';
import planClaimCell from './planClaimCell.js';
import readClaimCandidates from './readClaimCandidates.js';
import readWonClaims from './readWonClaims.js';

const maxRounds = 5;

function addTried({ tried, cells }) {
  cells.forEach(({ target, doc }) => {
    const ids = tried.get(target.columnKey) ?? [];
    ids.push(doc._id);
    tried.set(target.columnKey, ids);
  });
}

// Claims up to `limit` cells in rounds. Each round reads the oldest claimable cells and
// writes every claim as a compare-and-set in one unordered bulkWrite. When a concurrent
// worker won some of them, or some candidates only needed a status (missing input, lease
// out of attempts, deferred), the next round reads further candidates, so a worker that lost
// a race does not stop while cells are still queued.
async function runClaim({
  collection,
  compiled,
  generateToken,
  logCollection,
  now,
  tenant,
  tenantGuard,
}) {
  const { filter, limit } = compiled;
  const claims = [];
  const tried = new Map();
  let written = 0;
  let organizationId = null;
  for (let round = 0; round < maxRounds && claims.length < limit; round += 1) {
    const candidates = await readClaimCandidates({
      collection,
      compiled,
      count: limit - claims.length,
      now,
      tenant,
      tried,
    });
    if (candidates.length === 0) break;
    addTried({ tried, cells: candidates });
    const cells = candidates.map(({ doc, target }) =>
      planClaimCell({ doc, target, compiled, now, generateToken })
    );
    const operations = scopeWriteOperations({
      operations: cells.map((cell) => cell.operation),
      tenant,
      tenantGuard,
    });
    organizationId =
      getEnrichmentLogOrganization({ filter, logCollection, operations, tenantGuard }) ??
      organizationId;
    const result = await runBulkWriteBatches({ collection, operations });
    written += result.modifiedCount;
    const claimCells = cells.filter((cell) => cell.kind === 'claim');
    const won =
      result.modifiedCount === operations.length
        ? claimCells
        : await readWonClaims({ collection, cells: claimCells, tenant });
    claims.push(...won.map((cell) => cell.claim));
    const lost = claimCells.length - won.length;
    if (lost === 0 && claimCells.length === cells.length) break;
  }
  return { claims, organizationId, written };
}

export default runClaim;
