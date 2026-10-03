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
import { BSON } from 'mongodb';

// Parsed snapshots, per data set, kept while the manifest's pulledAt is unchanged: later journeys on
// the same data set skip the disk. A new pull changes pulledAt and the next load re-reads it.
const cache = new Map();

async function readCollectionFile({ snapshotDirectory, collection }) {
  const content = await fs.promises.readFile(
    path.join(snapshotDirectory, `${collection}.jsonl`),
    'utf8'
  );
  return content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => BSON.EJSON.parse(line, { relaxed: false }));
}

// The documents of a pulled snapshot, keyed by collection, from
// .lowdefy/data/<name>/<collection>.jsonl (canonical EJSON, one document per line).
async function loadSnapshot({ configDirectory, name, manifest }) {
  const cached = cache.get(name);
  if (cached !== undefined && cached.pulledAt === manifest.pulledAt) {
    return cached.documents;
  }
  const snapshotDirectory = path.join(configDirectory, '.lowdefy', 'data', name);
  const documents = {};
  await Promise.all(
    Object.keys(manifest.collections ?? {}).map(async (collection) => {
      documents[collection] = await readCollectionFile({ snapshotDirectory, collection });
    })
  );
  cache.set(name, { pulledAt: manifest.pulledAt, documents });
  return documents;
}

export default loadSnapshot;
