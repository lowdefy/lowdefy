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

const batchSize = 1000;

// Runs updateOne operations as unordered bulkWrites of at most 1000 operations each: one
// round trip per thousand cells, never one per cell. Every operation has its own guard in its
// filter, so their order does not matter.
async function runBulkWriteBatches({ collection, operations }) {
  let matchedCount = 0;
  let modifiedCount = 0;
  for (let start = 0; start < operations.length; start += batchSize) {
    // Batches run one after another, so one request holds at most one bulkWrite at a time.
    const result = await collection.bulkWrite(operations.slice(start, start + batchSize), {
      ordered: false,
    });
    matchedCount += result.matchedCount;
    modifiedCount += result.modifiedCount;
  }
  return { matchedCount, modifiedCount };
}

export default runBulkWriteBatches;
