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

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function detectPackageManager(cwd) {
  // Walk up from cwd to find the lock file
  let dir = cwd;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
    dir = path.dirname(dir);
  }
  return 'npm';
}

function buildInstallCommand({ packageManager, useExperimental, useMongoDB }) {
  const tag = useExperimental ? 'experimental' : 'latest';
  const packages = [`@lowdefy/e2e-utils@${tag}`, '@playwright/test@^1.50.0'];

  if (useMongoDB) {
    packages.push(`@lowdefy/community-plugin-e2e-mdb@${tag}`);
  }

  const devFlag = packageManager === 'yarn' ? '--dev' : '-D';
  return `${packageManager} add ${devFlag} ${packages.join(' ')}`;
}

function installPlaywright(appDir) {
  console.log('\nInstalling Playwright browsers...');
  console.log('  $ npx playwright install chromium\n');

  try {
    execSync('npx playwright install chromium', { cwd: appDir, stdio: 'inherit' });
    console.log('\n✓ Playwright browsers installed');
    return true;
  } catch {
    console.error('\n✗ Failed to install Playwright browsers');
    console.error('  Run manually: npx playwright install chromium');
    return false;
  }
}

function installDeps({ appDir, useExperimental, useMongoDB }) {
  const packageManager = detectPackageManager(appDir);
  const installCmd = buildInstallCommand({ packageManager, useExperimental, useMongoDB });

  console.log(`\nInstalling dependencies in ${appDir}...`);
  console.log(`  $ ${installCmd}\n`);

  try {
    execSync(installCmd, { cwd: appDir, stdio: 'inherit' });
    console.log('\n✓ Dependencies installed successfully');
  } catch {
    console.error('\n✗ Failed to install dependencies automatically');
    console.log(`\nInstall manually by running from ${appDir}:`);
    console.log(`  ${installCmd}`);
    console.log('  npx playwright install chromium');
    return false;
  }

  installPlaywright(appDir);
  return true;
}

export { detectPackageManager, buildInstallCommand };
export default installDeps;
