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

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { BSON, MongoClient } from 'mongodb';

import readSnapshotCollection from './readSnapshotCollection.mjs';
import writeSnapshotDirectory from './writeSnapshotDirectory.mjs';

function describeSource({ client, db }) {
  const hosts = client.options.srvHost ?? client.options.hosts.map(String).join(',');
  return `${hosts}/${db.databaseName}`;
}

function groupByCollection({ connections }) {
  const groups = {};
  connections.forEach((connection) => {
    groups[connection.collection] = groups[connection.collection] ?? [];
    groups[connection.collection].push(connection);
  });
  return groups;
}

// Reads every listed collection into .lowdefy/data/<name>.tmp, one canonical EJSON document per
// line, with a manifest, then swaps it over .lowdefy/data/<name>. Returns the manifest.
async function pullSnapshot({ configDirectory, dataSet, connections, env }) {
  const dataDirectory = path.join(configDirectory, '.lowdefy', 'data');
  const snapshotDirectory = path.join(dataDirectory, dataSet.name);
  const temporaryDirectory = `${snapshotDirectory}.tmp`;
  await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });
  await fs.promises.mkdir(temporaryDirectory, { recursive: true });

  const clients = {};
  const sources = new Set();
  const collections = {};
  try {
    const groups = groupByCollection({ connections });
    for (const [collectionName, group] of Object.entries(groups)) {
      const { secretName, databaseName } = group[0];
      if (clients[secretName] === undefined) {
        clients[secretName] = new MongoClient(env[`LOWDEFY_SECRET_${secretName}`]);
        await clients[secretName].connect();
      }
      const client = clients[secretName];
      const db = client.db(databaseName);
      sources.add(describeSource({ client, db }));
      const { documents, indexes } = await readSnapshotCollection({
        db,
        collectionName,
        connections: group,
      });
      const lines = documents.map((document) => BSON.EJSON.stringify(document, { relaxed: false }));
      await fs.promises.writeFile(
        path.join(temporaryDirectory, `${collectionName}.jsonl`),
        lines.length === 0 ? '' : `${lines.join('\n')}\n`
      );
      collections[collectionName] = {
        connections: group.map((connection) => connection.connectionId),
        count: documents.length,
        indexes,
      };
    }
    const manifest = {
      name: dataSet.name,
      from: dataSet.snapshotSpec.from,
      pulledAt: new Date().toISOString(),
      specHash: dataSet.specHash,
      // Tells two snapshots' sources apart without recording where they came from.
      sourceHash: crypto
        .createHash('sha256')
        .update([...sources].sort().join('\n'))
        .digest('hex'),
      collections,
    };
    await fs.promises.writeFile(
      path.join(temporaryDirectory, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    await writeSnapshotDirectory({ temporaryDirectory, snapshotDirectory });
    return manifest;
  } catch (error) {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  } finally {
    await Promise.all(Object.values(clients).map((client) => client.close()));
  }
}

export default pullSnapshot;
