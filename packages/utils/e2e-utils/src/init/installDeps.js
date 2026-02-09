/*
  Copyright 2020-2024 Lowdefy, Inc

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
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

function buildInstallCommand({ packageManager, useExperimental, useMongoDB }) {
  const tag = useExperimental ? 'experimental' : 'latest';
  const packages = [`@lowdefy/e2e-utils@${tag}`, '@playwright/test@^1.50.0'];

  if (useMongoDB) {
    packages.push(`@lowdefy/community-plugin-e2e-mdb@${tag}`);
  }

  const addCmd = packageManager === 'yarn' ? 'add' : 'add';
  const devFlag = packageManager === 'yarn' ? '--dev' : '-D';

  return `${packageManager} ${addCmd} ${devFlag} ${packages.join(' ')}`;
}

function runInstall({ cwd, packageManager, useExperimental, useMongoDB }) {
  const installCmd = buildInstallCommand({ packageManager, useExperimental, useMongoDB });

  console.log(`\nInstalling dependencies with ${packageManager}...`);
  console.log(`  $ ${installCmd}\n`);

  try {
    execSync(installCmd, { cwd, stdio: 'inherit' });
    console.log('\n✓ Dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('\n✗ Failed to install dependencies');
    console.error(`  Run manually: ${installCmd}`);
    return false;
  }
}

function installPlaywright(cwd) {
  console.log('\nInstalling Playwright browsers...');
  console.log('  $ npx playwright install chromium\n');

  try {
    execSync('npx playwright install chromium', { cwd, stdio: 'inherit' });
    console.log('\n✓ Playwright browsers installed');
    return true;
  } catch (error) {
    console.error('\n✗ Failed to install Playwright browsers');
    console.error('  Run manually: npx playwright install chromium');
    return false;
  }
}

function installDeps({ cwd, useExperimental, useMongoDB }) {
  const packageManager = detectPackageManager(cwd);
  const depsInstalled = runInstall({ cwd, packageManager, useExperimental, useMongoDB });

  if (depsInstalled) {
    installPlaywright(cwd);
  }

  return depsInstalled;
}

export { detectPackageManager, buildInstallCommand };
export default installDeps;
