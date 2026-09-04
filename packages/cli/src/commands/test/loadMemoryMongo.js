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
import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';

const INSTALL_HINT =
  'Request tests with "seed" need an in-memory MongoDB. Install it: pnpm add -D mongodb-memory-server mongodb';

function isModuleNotFound(error) {
  return (
    error.code === 'ERR_MODULE_NOT_FOUND' ||
    error.code === 'MODULE_NOT_FOUND' ||
    /Cannot find (module|package)/.test(error.message ?? '')
  );
}

// The two packages are optional peers of the CLI, so they resolve from the CLI's
// own tree when hoisted and from the app directory when the app installed them.
async function importOptional({ name, configDirectory }) {
  try {
    return await import(name);
  } catch (error) {
    if (!isModuleNotFound(error)) {
      throw error;
    }
  }
  const require = createRequire(path.join(configDirectory, 'package.json'));
  let resolved;
  try {
    resolved = require.resolve(name);
  } catch {
    throw new Error(INSTALL_HINT);
  }
  return import(pathToFileURL(resolved).href);
}

// Loads mongodb-memory-server and the mongodb driver, or throws the install hint.
// ObjectId comes back with the client because the seeder revives the { _oid }
// marker with it.
// Called only when at least one request test declares `seed`.
async function loadMemoryMongo({ configDirectory }) {
  const [memoryServer, driver] = await Promise.all([
    importOptional({ name: 'mongodb-memory-server', configDirectory }),
    importOptional({ name: 'mongodb', configDirectory }),
  ]);
  return {
    MongoMemoryServer: memoryServer.MongoMemoryServer,
    MongoClient: driver.MongoClient,
    ObjectId: driver.ObjectId,
  };
}

export { INSTALL_HINT };
export default loadMemoryMongo;
