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

import { type } from '@lowdefy/helpers';

// `label` names where a document comes from in a message: "fixture " or "generate.".
function addIds({ held, connectionId, collection, documents, label }) {
  held[collection] = held[collection] ?? new Map();
  documents.forEach((document, index) => {
    if (type.isUndefined(document._id)) return;
    held[collection].set(JSON.stringify(document._id), {
      connectionId,
      where: `${label}${connectionId}[${index}]`,
    });
  });
}

// parseDataSet refuses a generated _id that is also a fixture's or generated twice, within one
// connection. Two connections can name one collection, and the store loads them into it together,
// where a fixture would silently replace a generated document with its _id. This refuses the same
// collisions across connections, which only the dev build's collection map can see.
function checkSharedCollectionIds({ dataSetName, dataSet }) {
  const held = {};
  Object.entries(dataSet.fixtures).forEach(([connectionId, documents]) => {
    addIds({
      held,
      connectionId,
      collection: dataSet.collections[connectionId],
      documents,
      label: 'fixture ',
    });
  });
  Object.entries(dataSet.generated).forEach(([connectionId, documents]) => {
    const collection = dataSet.collections[connectionId];
    const ids = held[collection] ?? new Map();
    documents.forEach((document, index) => {
      const key = JSON.stringify(document._id);
      const holder = ids.get(key);
      if (type.isUndefined(holder) || holder.connectionId === connectionId) return;
      throw new Error(
        `Data set "${dataSetName}" generate.${connectionId}[${index}] _id ${key} is also the _id of ${holder.where}; connections "${connectionId}" and "${holder.connectionId}" both load collection "${collection}".`
      );
    });
    addIds({
      held,
      connectionId,
      collection,
      documents,
      label: 'generate.',
    });
  });
}

export default checkSharedCollectionIds;
