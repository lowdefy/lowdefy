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

import adviseDataSetSize from './adviseDataSetSize.js';
import generateDataSetDocuments from './generateDataSetDocuments.js';
import mergeDataSetFiles from './mergeDataSetFiles.js';
import readDataSetFiles from './readDataSetFiles.js';
import validateDataSetGenerate from './validateDataSetGenerate.js';

// Reads and checks tests/data/<name>.yaml, with the data sets it extends, with no build, no server
// and no database driver, so the dev server and the CLI read data sets the same way. The checks that
// need the built connections belong to the dev server's readDataSet.
//
// generate stays per file: only the named data set's own generate runs, and its refs and _id checks
// see the merged fixtures.
async function parseDataSet({ configDirectory, name }) {
  const files = await readDataSetFiles({ configDirectory, name });
  const file = files[files.length - 1];
  const { fixtures, users, indexes } = mergeDataSetFiles({ files });
  const generate = validateDataSetGenerate({ generate: file.generate, fixtures, fail: file.fail });
  const generated = generateDataSetDocuments({ generate, fixtures, fail: file.fail });
  const warnings = adviseDataSetSize({ name, fixtures, generated });

  return { name, filePath: file.filePath, fixtures, generated, users, indexes, warnings };
}

export default parseDataSet;
