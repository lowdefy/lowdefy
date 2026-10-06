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

import countDataSetDocuments from './countDataSetDocuments.js';
import listDataSetFiles from './listDataSetFiles.js';
import parseDataSet from './parseDataSet.js';

// One entry per data set file, for `lowdefy data list`: its name, how many documents it loads and
// how many users it names.
async function listDataSets({ configDirectory }) {
  const names = [...new Set((await listDataSetFiles({ configDirectory })).map(({ name }) => name))];
  const dataSets = [];
  for (const name of names) {
    const dataSet = await parseDataSet({ configDirectory, name });
    dataSets.push({
      name,
      documents: countDataSetDocuments({ dataSet }),
      users: Object.keys(dataSet.users).length,
    });
  }
  return dataSets;
}

export default listDataSets;
