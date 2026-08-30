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
import YAML from 'yaml';
import { ConfigError } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

import readFile from './readFile.js';

const FIXTURES_DIRECTORY = 'fixtures';

function validateName({ name }) {
  if (!type.isString(name) || name === '') {
    throw new ConfigError(
      `Fixture name must be a non-empty string. Received ${JSON.stringify(name)}.`
    );
  }
  // The name is a file name inside fixtures/, never a path - an agent supplies
  // it over the MCP, so it must not be able to name a file outside that directory.
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new ConfigError(
      `Fixture name must not contain path segments. Received ${JSON.stringify(name)}.`
    );
  }
}

async function readFixtureFile({ configDirectory, name }) {
  const directory = path.join(configDirectory, FIXTURES_DIRECTORY);
  let raw = await readFile(path.join(directory, `${name}.yaml`));
  if (type.isNone(raw)) {
    raw = await readFile(path.join(directory, `${name}.yml`));
  }
  if (type.isNone(raw)) {
    throw new ConfigError(`Fixture "${name}" not found. Expected fixtures/${name}.yaml.`);
  }
  try {
    return YAML.parse(raw);
  } catch (error) {
    throw new ConfigError(`Fixture "${name}" is not valid YAML: ${error.message}`, {
      cause: error,
    });
  }
}

// Reads fixtures/<name>.yaml under the config directory: a map keyed by
// connectionId - the same key a request test's `seed:` uses - to the documents
// that connection's collection should hold. Returns the connections in file
// order with `~d` markers revived to Dates. A pure reader: resolving the
// collection, dropping and inserting belong to whichever seeder calls it (the
// CLI test runner with the driver, the dev server through the connection layer).
async function readFixture({ configDirectory, name }) {
  validateName({ name });
  const parsed = await readFixtureFile({ configDirectory, name });
  if (!type.isObject(parsed)) {
    throw new ConfigError(
      `Fixture "${name}" must be an object keyed by connectionId. Received ${JSON.stringify(
        parsed
      )}.`
    );
  }
  const connections = Object.keys(parsed).map((connectionId) => {
    const docs = parsed[connectionId];
    if (!type.isArray(docs)) {
      throw new ConfigError(
        `Fixture "${name}" key "${connectionId}" must be an array of documents. Received ${JSON.stringify(
          docs
        )}.`
      );
    }
    docs.forEach((doc, index) => {
      if (!type.isObject(doc)) {
        throw new ConfigError(
          `Fixture "${name}" key "${connectionId}" document ${index} must be an object. Received ${JSON.stringify(
            doc
          )}.`
        );
      }
    });
    return { connectionId, docs: serializer.deserialize(docs) };
  });
  return { name, connections };
}

export default readFixture;
