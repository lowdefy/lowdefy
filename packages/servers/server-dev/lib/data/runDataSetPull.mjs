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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { parseDataSet } from '@lowdefy/node-utils';

import buildForPull from './buildForPull.mjs';
import checkPullGuards from './checkPullGuards.mjs';
import pullSnapshot from './pullSnapshot.mjs';
import resolvePullConnections from './resolvePullConnections.mjs';

// `lowdefy data pull <name>`: build as the `from` environment, check every secret the pull reads
// against the environments' guards, then copy the listed connections into .lowdefy/data/<name>.
async function runDataSetPull({ configDirectory, name, serverDirectory, logger, env }) {
  const dataSet = await parseDataSet({ configDirectory, name });
  if (type.isNone(dataSet.snapshotSpec)) {
    throw new Error(`Data set "${name}" has no snapshot block, so there is nothing to pull.`);
  }
  const { from } = dataSet.snapshotSpec;
  const buildDirectory = await buildForPull({
    configDirectory,
    serverDirectory,
    from,
    logger,
    refResolver: env.LOWDEFY_BUILD_REF_RESOLVER,
  });
  const environmentGuards = JSON.parse(
    await fs.promises.readFile(path.join(buildDirectory, 'environmentGuards.json'), 'utf8')
  );
  const connections = await resolvePullConnections({ buildDirectory, dataSet });
  checkPullGuards({ connections, dataSetName: name, from, environmentGuards, env });
  const manifest = await pullSnapshot({ configDirectory, dataSet, connections, env });
  const documents = Object.values(manifest.collections).reduce(
    (total, collection) => total + collection.count,
    0
  );
  logger.info(
    `Pulled data set "${name}" from ${from}: ${documents} documents in ${
      Object.keys(manifest.collections).length
    } collections, into .lowdefy/data/${name}.`
  );
  return manifest;
}

export default runDataSetPull;
