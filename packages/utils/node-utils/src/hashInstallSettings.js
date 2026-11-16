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

// Hashes everything an install depends on apart from the dependency lists:
// the rest of package.json (pnpm overrides, optional dependencies,
// packageManager), pnpm-workspace.yaml and .npmrc. A missing file hashes
// differently from an empty one.
function hashInstallSettings({ packageJson, workspaceYamlContent, npmrcContent }) {
  const packageSettings = { ...packageJson };
  delete packageSettings.dependencies;
  delete packageSettings.devDependencies;
  return crypto
    .createHash('sha1')
    .update(JSON.stringify([packageSettings, workspaceYamlContent, npmrcContent]))
    .digest('base64');
}

export default hashInstallSettings;
