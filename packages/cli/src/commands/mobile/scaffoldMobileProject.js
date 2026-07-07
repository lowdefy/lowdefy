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
import { writeFile } from '@lowdefy/node-utils';

const gitignore = `node_modules/
www/
`;

// sharp (via @capacitor/assets) needs its postinstall build — pnpm fails the
// install when build scripts are ignored. allowBuilds is the pnpm 11 key,
// onlyBuiltDependencies the pnpm 10 one.
const pnpmWorkspace = `allowBuilds:
  sharp: true
onlyBuiltDependencies:
  - sharp
`;

// Placeholder so "cap add" accepts the webDir before the first mobile build.
const placeholderHtml = `<!doctype html>
<html>
  <head><title>Lowdefy</title></head>
  <body>Run "lowdefy mobile build" to build the app bundle.</body>
</html>
`;

// The mobile/ directory is committed — it accumulates user-owned state
// (signing config, entitlements, icons/splash, extra native plugins). The
// ephemeral Vite tooling lives in gitignored .lowdefy/mobile instead.
async function scaffoldMobileProject({ context, appId }) {
  const directory = context.directories.mobileProject;

  const packageJsonPath = path.join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = {
      name: `${appId.split('.').pop()}-mobile`,
      private: true,
      description: 'Capacitor project for the Lowdefy mobile app. Managed by "lowdefy mobile".',
      dependencies: {
        '@capacitor/android': '^8.0.0',
        '@capacitor/app': '^8.0.0',
        '@capacitor/core': '^8.0.0',
        '@capacitor/ios': '^8.0.0',
      },
      devDependencies: {
        '@capacitor/assets': '^3.0.5',
        '@capacitor/cli': '^8.0.0',
      },
    };
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2).concat('\n'));
    context.logger.info(`Created ${packageJsonPath}.`);
  }

  const gitignorePath = path.join(directory, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    await writeFile(gitignorePath, gitignore);
    context.logger.info(`Created ${gitignorePath}.`);
  }

  const pnpmWorkspacePath = path.join(directory, 'pnpm-workspace.yaml');
  if (!fs.existsSync(pnpmWorkspacePath)) {
    await writeFile(pnpmWorkspacePath, pnpmWorkspace);
  }

  const indexPath = path.join(directory, 'www', 'index.html');
  if (!fs.existsSync(indexPath)) {
    await writeFile(indexPath, placeholderHtml);
  }
}

export default scaffoldMobileProject;
