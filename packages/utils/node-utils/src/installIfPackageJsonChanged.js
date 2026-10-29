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

import hashInstallSettings from './hashInstallSettings.js';
import isInstallSatisfied from './isInstallSatisfied.js';
import readFile from './readFile.js';
import readInstallFiles from './readInstallFiles.js';
import writeFile from './writeFile.js';
import writeInstallState from './writeInstallState.js';

async function installIfPackageJsonChanged({ directory, install, skipIfInstalled = false }) {
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
  if (!type.isBoolean(skipIfInstalled)) {
    throw new Error(
      `installIfPackageJsonChanged skipIfInstalled must be a boolean. Received ${JSON.stringify(
        skipIfInstalled
      )}.`
    );
  }
  const { packageJsonContent, workspaceYamlContent, npmrcContent } = await readInstallFiles({
    directory,
  });
  // Both files are stored inside node_modules so deleting node_modules also
  // clears them, forcing the next run to install.
  const hashPath = path.join(directory, 'node_modules', '.lowdefy-install-hash');
  const statePath = path.join(directory, 'node_modules', '.lowdefy-install-state.json');
  if (skipIfInstalled) {
    const installStateContent = await readFile(statePath);
    if (installStateContent !== null) {
      const packageJson = JSON.parse(packageJsonContent);
      const satisfied = isInstallSatisfied({
        installState: JSON.parse(installStateContent),
        packageJson,
        settingsHash: hashInstallSettings({ packageJson, workspaceYamlContent, npmrcContent }),
      });
      if (satisfied) {
        return false;
      }
    }
  }
  const hash = crypto
    .createHash('sha1')
    .update(packageJsonContent)
    .update(workspaceYamlContent ?? '')
    .update(npmrcContent ?? '')
    .digest('base64');
  const previousHash = await readFile(hashPath);
  if (previousHash === hash) {
    return false;
  }
  await install();
  await writeFile(hashPath, hash);
  await writeInstallState({ directory, packageJson: JSON.parse(packageJsonContent), statePath });
  return true;
}

export default installIfPackageJsonChanged;
