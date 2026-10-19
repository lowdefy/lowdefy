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

import describeDatabaseTarget from './describeDatabaseTarget.js';

// Under a data session every redirected connection reads one database, so two connections that
// name one literal collection in different databases (a different databaseName or databaseUri
// secret) would merge into one collection. Connections whose collection or database is computed per
// request cannot be checked, and connections with no databaseUri are not redirected at all.
function findCollectionCollisions({ artifacts }) {
  const byCollection = {};
  Object.entries(artifacts).forEach(([connectionId, artifact]) => {
    const collection = artifact.properties?.collection;
    if (!type.isString(collection) || type.isUndefined(artifact.properties?.databaseUri)) return;
    const target = describeDatabaseTarget({ properties: artifact.properties });
    if (type.isNone(target)) return;
    byCollection[collection] = byCollection[collection] ?? [];
    byCollection[collection].push({ connectionId, target });
  });
  const collisions = [];
  Object.entries(byCollection).forEach(([collection, entries]) => {
    const sorted = entries.sort((a, b) => a.connectionId.localeCompare(b.connectionId));
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.target.databaseName === b.target.databaseName && a.target.uri === b.target.uri) {
          continue;
        }
        collisions.push({ collection, connectionIds: [a.connectionId, b.connectionId] });
      }
    }
  });
  return collisions;
}

export default findCollectionCollisions;
