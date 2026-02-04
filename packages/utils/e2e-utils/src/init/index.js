#!/usr/bin/env node

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
import { fileURLToPath } from 'url';
import prompts from 'prompts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function detectLowdefyApps(appsDir) {
  const entries = fs.readdirSync(appsDir, { withFileTypes: true });
  const apps = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const appPath = path.join(appsDir, entry.name);
      const lowdefyPath = path.join(appPath, 'lowdefy.yaml');

      if (fs.existsSync(lowdefyPath)) {
        apps.push({
          name: entry.name,
          path: `apps/${entry.name}`,
        });
      }
    }
  }

  return apps;
}

function generateSingleAppSetup(cwd) {
  const e2eDir = path.join(cwd, 'e2e');

  // Create e2e directory
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
    console.log('Created e2e/');
  }

  // Copy templates
  const templates = [
    { src: 'playwright.config.js.template', dest: 'playwright.config.js' },
    { src: 'example.spec.js.template', dest: 'example.spec.js' },
    { src: 'mocks.yaml.template', dest: 'mocks.yaml' },
  ];

  for (const { src, dest } of templates) {
    const srcPath = path.join(__dirname, 'templates', src);
    const destPath = path.join(e2eDir, dest);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Created e2e/${dest}`);
    } else {
      console.log(`Skipped e2e/${dest} (already exists)`);
    }
  }

  // Update package.json
  updatePackageJson(cwd);

  console.log('\n✓ E2E testing setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Install dependencies: pnpm add -D @lowdefy/e2e-utils @playwright/test@^1.50.0');
  console.log('  2. Install browsers: npx playwright install chromium');
  console.log('  3. Run tests: pnpm e2e');
  console.log('  4. Or use UI mode: pnpm e2e:ui');
}

function generateMultiAppSetup(cwd, selectedApps) {
  const e2eDir = path.join(cwd, 'e2e');

  // Create e2e directory
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
    console.log('Created e2e/');
  }

  // Assign ports starting from 3000
  const appsWithPorts = selectedApps.map((app, index) => ({
    ...app,
    port: 3000 + index,
  }));

  // Generate playwright.config.js
  const configPath = path.join(e2eDir, 'playwright.config.js');
  if (!fs.existsSync(configPath)) {
    const appsConfig = appsWithPorts
      .map(
        (app) => `    {
      name: '${app.name}',
      appDir: '${app.path}',
      port: ${app.port},
    }`
      )
      .join(',\n');

    const configContent = `import { createMultiAppConfig } from '@lowdefy/e2e-utils/config';

export default createMultiAppConfig({
  apps: [
${appsConfig},
  ],
});
`;
    fs.writeFileSync(configPath, configContent);
    console.log('Created e2e/playwright.config.js');
  } else {
    console.log('Skipped e2e/playwright.config.js (already exists)');
  }

  // Copy mocks template
  const mocksPath = path.join(e2eDir, 'mocks.yaml');
  if (!fs.existsSync(mocksPath)) {
    fs.copyFileSync(path.join(__dirname, 'templates', 'mocks.yaml.template'), mocksPath);
    console.log('Created e2e/mocks.yaml');
  } else {
    console.log('Skipped e2e/mocks.yaml (already exists)');
  }

  // Create test directories and example specs for each app
  const exampleTemplate = fs.readFileSync(
    path.join(__dirname, 'templates', 'example.spec.js.template'),
    'utf8'
  );

  for (const app of appsWithPorts) {
    const appTestDir = path.join(e2eDir, app.name);
    if (!fs.existsSync(appTestDir)) {
      fs.mkdirSync(appTestDir, { recursive: true });
      console.log(`Created e2e/${app.name}/`);
    }

    const specPath = path.join(appTestDir, 'example.spec.js');
    if (!fs.existsSync(specPath)) {
      fs.writeFileSync(specPath, exampleTemplate);
      console.log(`Created e2e/${app.name}/example.spec.js`);
    } else {
      console.log(`Skipped e2e/${app.name}/example.spec.js (already exists)`);
    }
  }

  // Update package.json
  updatePackageJson(cwd);

  console.log('\n✓ E2E testing setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Install dependencies: pnpm add -D @lowdefy/e2e-utils @playwright/test@^1.50.0');
  console.log('  2. Install browsers: npx playwright install chromium');
  console.log('  3. Run all apps: pnpm e2e');
  console.log('  4. Run specific app: pnpm e2e -- --project=<app-name>');
  console.log('  5. Or use UI mode: pnpm e2e:ui');
}

function updatePackageJson(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let updated = false;

    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts.e2e) {
      pkg.scripts.e2e = 'playwright test';
      updated = true;
    }
    if (!pkg.scripts['e2e:ui']) {
      pkg.scripts['e2e:ui'] = 'playwright test --ui';
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('Updated package.json with e2e scripts');
    }
  }
}

async function init() {
  const cwd = process.cwd();

  console.log('Setting up Lowdefy e2e testing...\n');

  // Detect project structure
  const appsDir = path.join(cwd, 'apps');
  const hasAppsDir = fs.existsSync(appsDir);
  const hasRootLowdefy = fs.existsSync(path.join(cwd, 'lowdefy.yaml'));

  let projectType = 'single';
  let selectedApps = [];

  // Check for multi-app structure
  if (hasAppsDir && !hasRootLowdefy) {
    const apps = detectLowdefyApps(appsDir);

    if (apps.length > 0) {
      console.log(`Found ${apps.length} Lowdefy app(s) in apps/ directory.\n`);

      const response = await prompts({
        type: 'select',
        name: 'projectType',
        message: 'What type of setup do you want?',
        choices: [
          { title: 'Multi-app (test multiple apps)', value: 'multi' },
          { title: 'Single app (configure manually)', value: 'single' },
        ],
      });

      // Handle Ctrl+C
      if (!response.projectType) {
        console.log('\nSetup cancelled.');
        process.exit(0);
      }

      projectType = response.projectType;

      if (projectType === 'multi') {
        const appResponse = await prompts({
          type: 'multiselect',
          name: 'apps',
          message: 'Which apps do you want to test?',
          choices: apps.map((app) => ({
            title: app.name,
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
      }

      console.log('');
    }
  }

  // Generate config based on project type
  if (projectType === 'multi' && selectedApps.length > 0) {
    generateMultiAppSetup(cwd, selectedApps);
  } else {
    generateSingleAppSetup(cwd);
  }
}

init().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
