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
import enrichPath from '../enrichment/enrichPath.js';
import scopeReadFilter from '../enrichment/scopeReadFilter.js';

// The cells a complete wrote, when fewer changed than it sent: a cell's claim can move on
// between the read and the write (its lease ran out and another worker claimed it). A cell
// that holds this result's token and is no longer running was written by it.
async function readAppliedCells({ collection, cells, tenant }) {
  const ids = [...new Map(cells.map((cell) => [String(cell.docId), cell.docId])).values()];
  const docs = await collection
    .find(scopeReadFilter({ filter: { _id: { $in: ids } }, tenant }), {
      projection: buildProjection([
        '_id',
        ...cells.flatMap(({ result }) => [
          enrichPath({ columnKey: result.columnKey, property: 'claimToken' }),
          enrichPath({ columnKey: result.columnKey, property: 'status' }),
        ]),
      ]),
    })
    .toArray();
  const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
  return cells.filter(({ docId, result }) => {
    const doc = docsById.get(String(docId));
    if (doc === undefined) return false;
    const { columnKey } = result;
    return (
      get(doc, enrichPath({ columnKey, property: 'claimToken' }), { default: null }) ===
        result.claimToken &&
      get(doc, enrichPath({ columnKey, property: 'status' }), { default: null }) !== 'running'
    );
  });
}

export default readAppliedCells;
