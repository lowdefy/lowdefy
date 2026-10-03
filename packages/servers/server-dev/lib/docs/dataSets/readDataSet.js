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
import { parseDataSet } from '@lowdefy/node-utils';

import findCollectionCollisions from './findCollectionCollisions.js';
import readConnectionArtifacts from './readConnectionArtifacts.js';
import resolveDataSetCollection from './resolveDataSetCollection.js';

function getKeyedConnectionIds({ dataSet }) {
  const ids = new Set([...Object.keys(dataSet.fixtures), ...Object.keys(dataSet.indexes)]);
  (dataSet.snapshotSpec?.connections ?? []).forEach((connection) => {
    ids.add(type.isString(connection) ? connection : connection.id);
  });
  return [...ids];
}

// The data set checks only the dev build can make, on top of parseDataSet's: every connection the
// data set names is a MongoDBCollection with a literal collection, and connections that would merge
// into one collection under the one-database redirect are refused (when the data set names one of
// them) or reported. Runs before any browser opens.
async function readDataSet({ configDirectory, buildDirectory, name }) {
  const dataSet = await parseDataSet({ configDirectory, name });
  const warnings = [];

  if (!type.isNone(dataSet.snapshotSpec)) {
    if (type.isNone(dataSet.snapshot)) {
      throw new Error(
        `Data set "${name}" has a snapshot block but no snapshot. Run: lowdefy data pull ${name} (with the ${dataSet.snapshotSpec.from} environment's secrets).`
      );
    }
    if (dataSet.snapshot.specHash !== dataSet.specHash) {
      warnings.push(
        `Data set "${name}" snapshot block changed since the last pull. Run: lowdefy data pull ${name}`
      );
    }
  }

  const artifacts = await readConnectionArtifacts({ buildDirectory });
  const keyedIds = getKeyedConnectionIds({ dataSet });
  const collections = {};
  keyedIds.forEach((connectionId) => {
    collections[connectionId] = resolveDataSetCollection({
      dataSetName: name,
      connectionId,
      artifact: artifacts[connectionId],
    }).collection;
  });

  findCollectionCollisions({ artifacts }).forEach(({ collection, connectionIds }) => {
    const [a, b] = connectionIds;
    const message = `Connections "${a}" and "${b}" both name collection "${collection}" in different databases; under a data set they read one database, so they share one collection.`;
    if (keyedIds.includes(a) || keyedIds.includes(b)) {
      throw new Error(`Data set "${name}": ${message}`);
    }
    warnings.push(message);
  });

  return { ...dataSet, configDirectory, collections, warnings };
}

export default readDataSet;
