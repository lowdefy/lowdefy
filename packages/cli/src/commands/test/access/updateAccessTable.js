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

import diffAccessTables from './diffAccessTables.js';
import readAccessFile from './readAccessFile.js';
import readBuildAuth from './readBuildAuth.js';
import writeAccessFile from './writeAccessFile.js';
import writeRolesDataSet from './writeRolesDataSet.js';

const DETAIL = '      ';
const FIRST_DATA_SET = 'roles';

// `lowdefy test --update-access`: rewrites tests/access.yaml from the build, keeping the data set
// it names. The first file is checked as data set "roles", and tests/data/roles.yaml is written
// first when the app has none. Returns { failed }.
async function updateAccessTable({ app, context }) {
  const configDirectory = context.directories.config;
  const file = readAccessFile({ configDirectory });
  if (!type.isUndefined(file.error)) {
    // The file's data set is kept on a rewrite, so a file that can not be read is not replaced.
    context.logger.error(
      `${file.error} Fix it, or delete it to write a new one checked as data set "${FIRST_DATA_SET}".`
    );
    return { failed: true };
  }
  let data = FIRST_DATA_SET;
  if (file.exists) {
    data = file.table.data;
  } else {
    const written = writeRolesDataSet({
      authJson: readBuildAuth({ directories: context.directories }),
      configDirectory,
    });
    if (!type.isUndefined(written)) {
      context.logger.info(`Wrote tests/data/roles.yaml with users ${written.join(', ')}.`);
    }
  }
  let actual;
  try {
    actual = await app.accessMatrix({ data });
  } catch (error) {
    context.logger.error(error.message);
    return { failed: true };
  }
  writeAccessFile({ configDirectory, table: { data, ...actual } });
  const pages = Object.keys(actual.pages).length;
  const endpoints = Object.keys(actual.endpoints).length;
  if (!file.exists) {
    context.logger.info(
      `Wrote tests/access.yaml: ${pages} pages and ${endpoints} endpoints as data set "${data}". Commit the files written.`
    );
    return { failed: false };
  }
  const lines = diffAccessTables({ expected: file.table, actual });
  if (lines.length === 0) {
    context.logger.info('tests/access.yaml is up to date.');
    return { failed: false };
  }
  context.logger.info('Updated tests/access.yaml:');
  lines.forEach((line) => context.logger.info(`${DETAIL}${line}`));
  return { failed: false };
}

export default updateAccessTable;
