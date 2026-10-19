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

import checkSharedCollectionIds from './checkSharedCollectionIds.js';
import describeTargetKey from './describeTargetKey.js';
import readConnectionArtifacts from './readConnectionArtifacts.js';
import resolveDataSetCollection from './resolveDataSetCollection.js';

function getKeyedConnectionIds({ dataSet }) {
  return [
    ...new Set([
      ...Object.keys(dataSet.fixtures),
      ...Object.keys(dataSet.generated),
      ...Object.keys(dataSet.indexes),
    ]),
  ];
}

// Every database target the built connections name, sorted, so each run numbers them alike and the
// first one (the database a computed target reads) is the same on every run.
function listDatabaseTargets({ artifacts }) {
  const keys = new Set();
  Object.values(artifacts).forEach((artifact) => {
    const key = describeTargetKey({ properties: artifact.properties });
    if (!type.isNone(key)) keys.add(key);
  });
  return [...keys].sort();
}

// The data set checks only the dev build can make, on top of parseDataSet's: every connection the
// data set names is a MongoDBCollection with a literal collection, and a generated _id that another
// connection on the same collection in the same database target also holds is refused. Adds the
// database target of each connection it names (targets) and of every connection in the build
// (databaseTargets): a data session gives each target a database of its own. Runs before any
// browser opens.
async function readDataSet({ configDirectory, buildDirectory, name }) {
  const dataSet = await parseDataSet({ configDirectory, name });
  const artifacts = await readConnectionArtifacts({ buildDirectory });
  const keyedIds = getKeyedConnectionIds({ dataSet });
  const collections = {};
  const targets = {};
  keyedIds.forEach((connectionId) => {
    const artifact = artifacts[connectionId];
    collections[connectionId] = resolveDataSetCollection({
      dataSetName: name,
      connectionId,
      artifact,
    }).collection;
    targets[connectionId] = describeTargetKey({ properties: artifact.properties });
  });
  const databaseTargets = listDatabaseTargets({ artifacts });

  checkSharedCollectionIds({ dataSetName: name, dataSet: { ...dataSet, collections, targets } });

  return { ...dataSet, collections, targets, databaseTargets };
}

export default readDataSet;
