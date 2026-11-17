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
import { type } from '@lowdefy/helpers';
import YAML from 'yaml';

import getAccessFilePath from './getAccessFilePath.js';

const SECTIONS = ['pages', 'endpoints'];
const OUTCOMES = new Set(['allow', 'deny', 'enrol_required']);

function checkSection({ content, section }) {
  const rows = content[section] ?? {};
  if (!type.isObject(rows)) {
    return `"${section}" should be an object of ${section} by id. Received ${JSON.stringify(rows)}.`;
  }
  const invalid = Object.entries(rows).find(
    ([, cells]) =>
      !type.isObject(cells) || !Object.values(cells).every((cell) => OUTCOMES.has(cell))
  );
  if (!type.isUndefined(invalid)) {
    return `"${section}.${invalid[0]}" should map each caller to allow, deny or enrol_required. Received ${JSON.stringify(
      invalid[1]
    )}.`;
  }
  return undefined;
}

// Reads tests/access.yaml: { exists: false } when the app has none, { table } with the data set
// it is checked as and its pages and endpoints rows, or { error } when the file can not be read
// as an access table.
function readAccessFile({ configDirectory }) {
  const filePath = getAccessFilePath({ configDirectory });
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return { error: `tests/access.yaml could not be read. ${error.message}` };
  }
  let content;
  try {
    content = YAML.parse(text);
  } catch (error) {
    return { error: `tests/access.yaml could not be parsed as YAML. ${error.message}` };
  }
  if (!type.isObject(content)) {
    return {
      error: 'tests/access.yaml should be an object with data, pages and endpoints.',
    };
  }
  if (!type.isString(content.data)) {
    return {
      error: `tests/access.yaml "data" should be the name of the data set in tests/data whose users the table is checked as. Received ${JSON.stringify(
        content.data
      )}.`,
    };
  }
  for (const section of SECTIONS) {
    const error = checkSection({ content, section });
    if (!type.isUndefined(error)) {
      return { error: `tests/access.yaml ${error}` };
    }
  }
  return {
    exists: true,
    table: { data: content.data, pages: content.pages ?? {}, endpoints: content.endpoints ?? {} },
  };
}

export default readAccessFile;
