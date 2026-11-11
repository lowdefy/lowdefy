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

// One group per database target and collection: `target` is the connection's target key (null when
// computed per request), the database the session loads the group into.
function ensureGroup({ groups, dataSet, connectionId }) {
  const target = dataSet.targets?.[connectionId] ?? null;
  const collection = dataSet.collections[connectionId];
  const key = JSON.stringify([target, collection]);
  if (!groups.has(key)) {
    groups.set(key, { target, collection, fixtures: [], generated: [], indexes: [] });
  }
  return groups.get(key);
}

// The data set keyed by database target and collection, the unit the store loads: fixtures,
// generated documents and indexes are keyed by connection id, and two connections that name one
// collection in one target load into it together. Connections in different targets load into
// different databases, so they never merge.
function groupDataSetByCollection({ dataSet }) {
  const groups = new Map();
  Object.entries(dataSet.fixtures).forEach(([connectionId, documents]) => {
    const group = ensureGroup({ groups, dataSet, connectionId });
    documents.forEach((document, index) => {
      group.fixtures.push({ connectionId, index, document });
    });
  });
  Object.entries(dataSet.generated).forEach(([connectionId, documents]) => {
    const group = ensureGroup({ groups, dataSet, connectionId });
    group.generated.push({ connectionId, documents });
  });
  Object.entries(dataSet.indexes).forEach(([connectionId, indexes]) => {
    const group = ensureGroup({ groups, dataSet, connectionId });
    group.indexes.push(...indexes);
  });
  return [...groups.values()];
}

export default groupDataSetByCollection;
