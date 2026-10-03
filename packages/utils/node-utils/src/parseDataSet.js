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

import path from 'path';
import { type } from '@lowdefy/helpers';
import YAML from 'yaml';

import dataSetNamePattern from './dataSetNamePattern.js';
import findRefPath from './findRefPath.js';
import hashDataSetSpec from './hashDataSetSpec.js';
import listDataSetFiles from './listDataSetFiles.js';
import readDataSetManifest from './readDataSetManifest.js';
import readFile from './readFile.js';
import validateDataSetFixtures from './validateDataSetFixtures.js';
import validateDataSetIndexes from './validateDataSetIndexes.js';
import validateDataSetSnapshot from './validateDataSetSnapshot.js';
import validateDataSetUsers from './validateDataSetUsers.js';

const topLevelKeys = ['snapshot', 'fixtures', 'users', 'indexes'];

// Reads and checks tests/data/<name>.yaml with no build, no server and no database driver, so the
// dev server and the CLI read data sets the same way. The checks that need the built connections
// belong to the dev server's readDataSet.
async function parseDataSet({ configDirectory, name }) {
  if (!type.isString(name) || !dataSetNamePattern.test(name)) {
    throw new Error(
      `Data set name ${JSON.stringify(
        name
      )} is not valid. Use lowercase letters, digits, "-" and "_".`
    );
  }
  const allFiles = await listDataSetFiles({ configDirectory });
  const files = allFiles.filter((file) => file.name === name);
  if (files.length === 0) {
    const declared = [...new Set(allFiles.map((file) => file.name))];
    throw new Error(
      `Data set "${name}" not found in tests/data. ${
        declared.length === 0 ? 'No data sets are declared.' : `Declared: ${declared.join(', ')}.`
      }`
    );
  }
  if (files.length > 1) {
    throw new Error(`Data set "${name}" has both tests/data/${name}.yaml and .yml; keep one.`);
  }
  const { filePath } = files[0];
  const relativePath = path.relative(configDirectory, filePath);
  function fail(message) {
    throw new Error(`Data set ${relativePath}: ${message}`);
  }

  let content;
  try {
    content = YAML.parse(await readFile(filePath));
  } catch (error) {
    fail(`could not parse YAML. ${error.message}`);
  }
  content = content ?? {};
  if (!type.isObject(content)) {
    fail('should be an object with fixtures, users, indexes and an optional snapshot.');
  }
  Object.keys(content).forEach((key) => {
    if (!topLevelKeys.includes(key)) {
      fail(`unknown key "${key}". Allowed: ${topLevelKeys.join(', ')}.`);
    }
  });
  const refPath = findRefPath({ value: content, path: '' });
  if (!type.isNone(refPath)) {
    fail(`_ref at ${refPath}. Data sets are plain YAML; _ref and operators are not evaluated.`);
  }

  const fixtures = validateDataSetFixtures({ fixtures: content.fixtures, fail });
  const users = validateDataSetUsers({ users: content.users, fail });
  const indexes = validateDataSetIndexes({ indexes: content.indexes, fail });
  const snapshotSpec = validateDataSetSnapshot({ snapshot: content.snapshot, fail });
  const snapshot = await readDataSetManifest({ configDirectory, name });

  return {
    name,
    filePath,
    fixtures,
    users,
    indexes,
    snapshotSpec,
    specHash: hashDataSetSpec({ snapshotSpec }),
    snapshot,
  };
}

export default parseDataSet;
