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

const ADVISED_DOCUMENTS = 1000;

// Size advice, never a refusal: a connection loading more than 1,000 documents makes every journey
// on the data set load slower, and journeys target fixture values, not volume.
function adviseDataSetSize({ name, fixtures, generated }) {
  const connectionIds = [...new Set([...Object.keys(fixtures), ...Object.keys(generated)])];
  return connectionIds.flatMap((connectionId) => {
    const count = (fixtures[connectionId]?.length ?? 0) + (generated[connectionId]?.length ?? 0);
    if (count <= ADVISED_DOCUMENTS) return [];
    return [
      `Data set "${name}" loads ${count.toLocaleString(
        'en-US'
      )} documents for connection "${connectionId}". More than 1,000 per collection is not advised: every journey on it loads slower, and journeys target fixture values, not volume.`,
    ];
  });
}

export default adviseDataSetSize;
