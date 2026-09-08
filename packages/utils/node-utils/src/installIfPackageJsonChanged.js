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

import crypto from 'crypto';
import path from 'path';
import { type } from '@lowdefy/helpers';

import readFile from './readFile.js';
import writeFile from './writeFile.js';

async function installIfPackageJsonChanged({ directory, install }) {
  if (!type.isString(directory)) {
    throw new Error(
      `installIfPackageJsonChanged requires a directory string. Received ${JSON.stringify(
        directory
      )}.`
    );
  }
  if (!type.isFunction(install)) {
    throw new Error('installIfPackageJsonChanged requires an install function.');
  }
  const packageJsonContent = await readFile(path.join(directory, 'package.json'));
  if (packageJsonContent === null) {
    throw new Error(`Could not read package.json in ${directory}.`);
  }
  const hash = crypto.createHash('sha1').update(packageJsonContent).digest('base64');
  // Stored inside node_modules so deleting node_modules also clears the hash,
  // forcing the next run to install.
  const hashPath = path.join(directory, 'node_modules', '.lowdefy-install-hash');
  const previousHash = await readFile(hashPath);
  if (previousHash === hash) {
    return false;
  }
  await install();
  await writeFile(hashPath, hash);
  return true;
}

export default installIfPackageJsonChanged;
