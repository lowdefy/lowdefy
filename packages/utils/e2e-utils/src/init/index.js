#!/usr/bin/env node

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
import prompts from 'prompts';

import detectApps from './detectApps.js';
import generateFiles from './generateFiles.js';
import updateGitignore from './updateGitignore.js';

function detectPackageManager(cwd) {
  let dir = cwd;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
    dir = path.dirname(dir);
  }
  return 'npm';
}

async function init() {
  const cwd = process.cwd();

  console.log('Setting up Lowdefy e2e testing...\n');

  // Step 1: Detect Lowdefy apps
  const apps = detectApps(cwd);

  if (apps.length === 0) {
    console.log('No Lowdefy app found.');
    console.log('\nMake sure you run this command from a directory containing:');
    console.log('  - A lowdefy.yaml file (single app)');
    console.log('  - An app/ folder with lowdefy.yaml');
    console.log('  - An apps/ folder with subdirectories containing lowdefy.yaml');
    process.exit(1);
  }

  // Step 2: Select apps if multiple found
  let selectedApps = apps;

  if (apps.length > 1) {
    console.log(`Found ${apps.length} Lowdefy app(s):\n`);
    for (const app of apps) {
      console.log(`  - ${app.name} (${app.path})`);
    }
    console.log('');

    const appResponse = await prompts({
      type: 'multiselect',
      name: 'apps',
      message: 'Which apps do you want to set up e2e testing for?',
      choices: apps.map((app) => ({
        title: `${app.name} (${app.path})`,
        value: app,
        selected: true,
      })),
      min: 1,
    });

    // Handle Ctrl+C
    if (!appResponse.apps) {
      console.log('\nSetup cancelled.');
      process.exit(0);
    }

    selectedApps = appResponse.apps;
  } else {
    console.log(`Found Lowdefy app: ${apps[0].name} (${apps[0].path})\n`);
  }

  // Step 3: Ask about MongoDB support
  const mongoResponse = await prompts({
    type: 'confirm',
    name: 'useMongoDB',
    message: 'Would you like to add MongoDB testing support?',
    initial: false,
  });

  // Handle Ctrl+C
  if (mongoResponse.useMongoDB === undefined) {
    console.log('\nSetup cancelled.');
    process.exit(0);
  }

  const useMongoDB = mongoResponse.useMongoDB;

  // Step 4: Ask about version preference
  const versionResponse = await prompts({
    type: 'select',
    name: 'version',
    message: 'Which version do you want to install?',
    choices: [
      { title: 'Stable (recommended for production)', value: 'stable' },
      {
        title: 'Experimental (latest features, may have breaking changes)',
        value: 'experimental',
      },
    ],
  });

  // Handle Ctrl+C
  if (!versionResponse.version) {
    console.log('\nSetup cancelled.');
    process.exit(0);
  }

  const useExperimental = versionResponse.version === 'experimental';

  // Step 5: Generate files and write dependencies to package.json
  for (const app of selectedApps) {
    generateFiles({ cwd, app, useExperimental, useMongoDB });
  }

  // Step 6: Update .gitignore
  updateGitignore(cwd);

  // Step 7: Print completion summary and next steps
  console.log('\n✓ E2E testing setup complete!\n');
  console.log('Next steps:\n');

  let step = 1;

  // Install instructions
  const packageManager = detectPackageManager(cwd);
  console.log(`  ${step}. Install dependencies:`);
  if (selectedApps.length === 1) {
    console.log(`     cd ${selectedApps[0].path}`);
  }
  console.log(`     ${packageManager} install`);
  console.log('     npx playwright install chromium');
  step += 1;

  // MongoDB setup
  if (useMongoDB) {
    console.log(`\n  ${step}. Configure MongoDB testing:`);
    console.log('     Copy .env.e2e to .env.e2e.local');
    console.log('     Set LOWDEFY_E2E_MONGODB_URI to your test database');
    console.log('     See mongodb.spec.js for example tests');
    step += 1;
  }

  // Run tests
  console.log(`\n  ${step}. Run tests:`);
  if (selectedApps.length === 1) {
    console.log(`     cd ${selectedApps[0].path}`);
    console.log('     pnpm e2e            # Run all tests');
    console.log('     pnpm e2e:headed     # Run with visible browser');
    console.log('     pnpm e2e:ui         # Playwright UI mode');
    console.log('     pnpm e2e:server     # Start server for reuse');
  } else {
    for (const app of selectedApps) {
      console.log(`     cd ${app.path} && pnpm e2e`);
    }
  }
}

init().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
