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
import { type } from '@lowdefy/helpers';
import YAML from 'yaml';

function checkStringList({ value, field, label }) {
  if (type.isUndefined(value)) return undefined;
  if (!type.isArray(value) || value.length === 0) {
    throw new Error(
      `${label} ${field} should be a list of ${
        field === 'pages' ? 'page ids' : 'data set users'
      }. Received ${JSON.stringify(value)}.`
    );
  }
  value.forEach((entry) => {
    if (!type.isString(entry) || entry.trim() === '') {
      throw new Error(`${label} ${field} should hold strings. Received ${JSON.stringify(entry)}.`);
    }
  });
  return [...new Set(value)];
}

function checkCharter({ entry, index }) {
  const label = `Charter ${index + 1}:`;
  if (!type.isObject(entry)) {
    throw new Error(
      `${label} should be { goal, pages?, roles? }. Received ${JSON.stringify(entry)}.`
    );
  }
  const unknown = Object.keys(entry).filter((key) => !['goal', 'pages', 'roles'].includes(key));
  if (unknown.length > 0) {
    throw new Error(
      `${label} has unknown keys ${unknown.join(', ')}. A charter is { goal, pages?, roles? }.`
    );
  }
  if (!type.isString(entry.goal) || entry.goal.trim() === '') {
    throw new Error(
      `${label} goal should be a sentence saying what to try. Received ${JSON.stringify(
        entry.goal
      )}.`
    );
  }
  return {
    goal: entry.goal.trim(),
    pages: checkStringList({ value: entry.pages, field: 'pages', label }),
    roles: checkStringList({ value: entry.roles, field: 'roles', label }),
  };
}

// The --charters file: a YAML list of { goal, pages?, roles? }, one charter
// each, read relative to the working directory. pages are page ids and roles
// data set users, as --page and --role take them; whether they exist is
// checked once the head build and the data set are known (checkCharters).
// Returns [{ goal, pages, roles }], pages and roles undefined when not given.
function readChartersFile({ filePath, cwd = process.cwd() }) {
  const resolved = path.resolve(cwd, filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`--charters file "${filePath}" does not exist.`);
  }
  let parsed;
  try {
    parsed = YAML.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    throw new Error(`--charters file "${filePath}" is not valid YAML: ${error.message}`);
  }
  if (!type.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      `--charters file "${filePath}" should be a list of charters, each { goal, pages?, roles? }. Received ${JSON.stringify(
        parsed
      )}.`
    );
  }
  return parsed.map((entry, index) => checkCharter({ entry, index }));
}

export default readChartersFile;
