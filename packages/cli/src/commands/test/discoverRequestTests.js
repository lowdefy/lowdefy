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
import YAML from 'yaml';
import { listConfigFiles } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

const REQUEST_TESTS_DIRECTORY = path.join('tests', 'requests');
// The ".test." infix is the marker that distinguishes a request test from the
// fixture or helper file an author may keep beside it; the directory is
// otherwise walked by the shared discovery rule.
const REQUEST_TEST_SUFFIXES = ['.test.yaml', '.test.yml'];

function readRequestTestFile({ filePath }) {
  let parsed;
  try {
    parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [{ filePath, test: undefined, error: `Invalid YAML: ${error.message}` }];
  }
  if (type.isArray(parsed)) {
    return parsed.map((test) => ({ filePath, test }));
  }
  return [{ filePath, test: parsed }];
}

// Reads tests/requests/**/*.test.{yaml,yml} through the shared discovery rule
// (listConfigFiles): recursive, byte-sorted, skipping "_" and "." prefixed
// names. One request test or a list per file. Returns items of
// { filePath, test } (or { filePath, error } for unparseable YAML) so a broken
// file is reported as a failed test rather than aborting the run.
function discoverRequestTests({ context }) {
  const directory = path.join(context.directories.config, REQUEST_TESTS_DIRECTORY);
  return listConfigFiles({ directory, suffixes: REQUEST_TEST_SUFFIXES }).flatMap(({ filePath }) =>
    readRequestTestFile({ filePath })
  );
}

export default discoverRequestTests;
