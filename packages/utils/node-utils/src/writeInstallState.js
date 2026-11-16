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

import hashInstallSettings from './hashInstallSettings.js';
import readInstallFiles from './readInstallFiles.js';
import writeFileAtomic from './writeFileAtomic.js';

// Records what an install put in place: the dependency lists it installed and
// a hash of its settings. pnpm can rewrite pnpm-workspace.yaml while it
// installs (minimumReleaseAgeExclude), and the next run keeps that, so the
// workspace files are read after the install, as the next run will see them.
async function writeInstallState({ directory, packageJson, statePath }) {
  const { workspaceYamlContent, npmrcContent } = await readInstallFiles({ directory });
  const installState = {
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    settingsHash: hashInstallSettings({ packageJson, workspaceYamlContent, npmrcContent }),
  };
  await writeFileAtomic(statePath, JSON.stringify(installState, null, 2).concat('\n'));
}

export default writeInstallState;
