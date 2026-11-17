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
import formatAccessCommand from './formatAccessCommand.js';
import formatFirstFileCommand from './formatFirstFileCommand.js';
import readAccessFile from './readAccessFile.js';
import readBuildAuth from './readBuildAuth.js';

const DETAIL = '      ';

// Compares the build's access table with tests/access.yaml and reports it: a PASS line, or a
// FAIL line with one line per difference and the command that accepts them. With no file, an app
// with auth is warned with the command that writes the first one, and `required` (--access)
// fails with it. Returns { failed }.
async function checkAccessTable({ app, context, required }) {
  const configDirectory = context.directories.config;
  const file = readAccessFile({ configDirectory });
  if (!type.isUndefined(file.error)) {
    context.logger.error(`FAIL  access table: ${file.error}`);
    return { failed: true };
  }
  if (!file.exists) {
    const command = formatFirstFileCommand({ configDirectory });
    if (required) {
      context.logger.error(
        `No tests/access.yaml to check. Write it with "${command}", then commit the files it writes.`
      );
      return { failed: true };
    }
    const authJson = readBuildAuth({ directories: context.directories });
    if (authJson.configured === true) {
      context.logger.warn(
        `This app has auth and no tests/access.yaml, so who reaches which page and endpoint is not checked. Write it with "${command}", then commit the files it writes.`
      );
    }
    return { failed: false };
  }
  let actual;
  try {
    actual = await app.accessMatrix({ data: file.table.data });
  } catch (error) {
    // A data set the table names that can not be read fails the check, not the run.
    context.logger.error(`FAIL  access table: ${error.message}`);
    return { failed: true };
  }
  const lines = diffAccessTables({ expected: file.table, actual });
  if (lines.length === 0) {
    const pages = Object.keys(actual.pages).length;
    const endpoints = Object.keys(actual.endpoints).length;
    context.logger.info(`PASS  access table  (${pages} pages, ${endpoints} endpoints)`);
    return { failed: false };
  }
  const accept = formatAccessCommand({ configDirectory, args: 'test --update-access' });
  context.logger.error('FAIL  access table: tests/access.yaml differs from the build');
  lines.forEach((line) => context.logger.error(`${DETAIL}${line}`));
  context.logger.error(
    `${DETAIL}If these changes are meant, run "${accept}" and commit tests/access.yaml.`
  );
  return { failed: true };
}

export default checkAccessTable;
