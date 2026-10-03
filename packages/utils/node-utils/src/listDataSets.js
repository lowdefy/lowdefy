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

import listDataSetFiles from './listDataSetFiles.js';
import parseDataSet from './parseDataSet.js';

const dayMs = 24 * 60 * 60 * 1000;

function countDocuments({ collections }) {
  return Object.values(collections).reduce(
    (total, collection) => total + (collection.count ?? 0),
    0
  );
}

// One entry per data set file, for `lowdefy data list` and for stale snapshot reports.
async function listDataSets({ configDirectory }) {
  const names = [...new Set((await listDataSetFiles({ configDirectory })).map(({ name }) => name))];
  const dataSets = [];
  for (const name of names) {
    const dataSet = await parseDataSet({ configDirectory, name });
    if (type.isNone(dataSet.snapshotSpec)) {
      dataSets.push({ name, kind: 'fixtures' });
      continue;
    }
    const entry = { name, kind: 'snapshot', from: dataSet.snapshotSpec.from };
    if (!type.isNone(dataSet.snapshot)) {
      entry.pulledAt = dataSet.snapshot.pulledAt;
      entry.ageDays = Math.floor((Date.now() - Date.parse(dataSet.snapshot.pulledAt)) / dayMs);
      entry.documents = countDocuments({ collections: dataSet.snapshot.collections });
      entry.specMatches = dataSet.snapshot.specHash === dataSet.specHash;
    }
    dataSets.push(entry);
  }
  return dataSets;
}

export default listDataSets;
