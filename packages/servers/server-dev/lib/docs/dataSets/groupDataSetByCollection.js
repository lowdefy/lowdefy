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

function ensureGroup({ groups, collection }) {
  groups[collection] = groups[collection] ?? { fixtures: [], indexes: [] };
  return groups[collection];
}

// The data set keyed by collection, the unit the store loads: fixtures and indexes are keyed by
// connection id, and two connections that name one collection load into it together.
function groupDataSetByCollection({ dataSet }) {
  const groups = {};
  Object.entries(dataSet.fixtures).forEach(([connectionId, documents]) => {
    const group = ensureGroup({ groups, collection: dataSet.collections[connectionId] });
    documents.forEach((document, index) => {
      group.fixtures.push({ connectionId, index, document });
    });
  });
  Object.entries(dataSet.indexes).forEach(([connectionId, indexes]) => {
    const group = ensureGroup({ groups, collection: dataSet.collections[connectionId] });
    group.indexes.push(...indexes);
  });
  return groups;
}

export default groupDataSetByCollection;
