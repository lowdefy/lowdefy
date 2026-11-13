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

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import buildCommand from './buildCommand.js';

// Loads a package from the built server's own install, never from this package's dependencies:
// the build was written by, and for, the releases the server installed, and classes and module
// state (error classes, the driver clients a connection keeps) must be the ones the server's
// plugins use.
//
// The package must be in <server>/node_modules itself. Node's resolution would otherwise go on
// to the folders above the server (the app's own install) and to NODE_PATH, which pnpm sets for
// the scripts it runs, and quietly load another copy.
async function importServerModule({ directories, name }) {
  const installed = path.join(directories.server, 'node_modules', name, 'package.json');
  if (!fs.existsSync(installed)) {
    throw new Error(
      `Could not find "${name}" in the Lowdefy server at "${directories.server}". Run "${buildCommand}" in the app's directory, which installs the server's packages, then run the tests again.`
    );
  }
  const require = createRequire(path.join(directories.server, 'package.json'));
  return import(pathToFileURL(require.resolve(name)).href);
}

export default importServerModule;
