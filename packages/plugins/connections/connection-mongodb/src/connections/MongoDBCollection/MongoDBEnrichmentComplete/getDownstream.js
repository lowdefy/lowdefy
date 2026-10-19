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

import getKeyId from '../MongoDBTableChanges/getKeyId.js';

// The autoRun columns each row runs next: those that read a column whose cell just completed
// ok. MongoDBEnrichmentComplete queues them itself (planQueueDownstream); the response names
// them.
function getDownstream({ applied, downstreamByColumn }) {
  const byRow = new Map();
  applied.forEach(({ kind, result }) => {
    if (kind !== 'ok') return;
    const columns = downstreamByColumn.get(result.columnKey) ?? [];
    if (columns.length === 0) return;
    const keyId = getKeyId(result.rowKey);
    const entry = byRow.get(keyId) ?? { rowKey: result.rowKey, columns: [] };
    columns.forEach((columnKey) => {
      if (!entry.columns.includes(columnKey)) entry.columns.push(columnKey);
    });
    byRow.set(keyId, entry);
  });
  return [...byRow.values()];
}

export default getDownstream;
