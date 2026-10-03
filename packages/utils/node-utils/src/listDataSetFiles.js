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

import fs from 'fs';
import path from 'path';

const dataSetExtensions = ['.yaml', '.yml'];

// Every data set file in tests/data, sorted by name. A name with both a .yaml and a .yml file is
// listed twice, so parseDataSet can refuse the ambiguity.
async function listDataSetFiles({ configDirectory }) {
  const directory = path.join(configDirectory, 'tests', 'data');
  let entries;
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && dataSetExtensions.includes(path.extname(entry.name)))
    .map((entry) => ({
      name: path.basename(entry.name, path.extname(entry.name)),
      filePath: path.join(directory, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.filePath.localeCompare(b.filePath));
}

export default listDataSetFiles;
