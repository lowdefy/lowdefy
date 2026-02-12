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
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyTemplate(templateName, destPath) {
  const srcPath = path.join(__dirname, 'templates', templateName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    return true;
  }
  return false;
}

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

function addOnlyBuiltDependency({ cwd, appPath, dependency }) {
  const appDir = path.join(cwd, appPath);
  const workspaceRoot = findWorkspaceRoot(appDir);

  // In a pnpm workspace, onlyBuiltDependencies must be in the workspace root package.json
  const targetDir = workspaceRoot ?? path.join(cwd, appPath);
  const pkgPath = path.join(targetDir, 'package.json');

  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allowedBuilds = pkg.pnpm?.onlyBuiltDependencies ?? [];

  if (!allowedBuilds.includes(dependency)) {
    pkg.pnpm = pkg.pnpm || {};
    pkg.pnpm.onlyBuiltDependencies = [...allowedBuilds, dependency];
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    const label = workspaceRoot ? 'workspace root package.json' : `${appPath}/package.json`;
    console.log(`  ✓ Added ${dependency} to pnpm.onlyBuiltDependencies in ${label}`);
  }
}

function updatePackageJson({ appPath, cwd, useExperimental, useMongoDB }) {
  const pkgPath = path.join(cwd, appPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`  ⚠ No package.json found at ${appPath}/package.json`);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let updated = false;

  // Add scripts
  pkg.scripts = pkg.scripts || {};

  if (!pkg.scripts.e2e) {
    pkg.scripts.e2e = 'playwright test --config=e2e/playwright.config.js';
    updated = true;
  }

  if (!pkg.scripts['e2e:ui']) {
    pkg.scripts['e2e:ui'] = 'playwright test --ui --config=e2e/playwright.config.js';
    updated = true;
  }

  // Add devDependencies
  const tag = useExperimental ? 'experimental' : 'latest';
  pkg.devDependencies = pkg.devDependencies || {};

  if (!pkg.devDependencies['@lowdefy/e2e-utils']) {
    pkg.devDependencies['@lowdefy/e2e-utils'] = tag;
    updated = true;
  }

  if (!pkg.devDependencies['@playwright/test']) {
    pkg.devDependencies['@playwright/test'] = '^1.50.0';
    updated = true;
  }

  if (useMongoDB && !pkg.devDependencies['@lowdefy/community-plugin-e2e-mdb']) {
    pkg.devDependencies['@lowdefy/community-plugin-e2e-mdb'] = tag;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✓ Updated ${appPath}/package.json with e2e scripts and dependencies`);
  }

  // mongodb-memory-server needs onlyBuiltDependencies (workspace-aware)
  if (useMongoDB) {
    addOnlyBuiltDependency({ cwd, appPath, dependency: 'mongodb-memory-server' });
  }

  return updated;
}

function generateFiles({ cwd, app, useExperimental, useMongoDB }) {
  const appFullPath = path.join(cwd, app.path);
  const e2eDir = path.join(appFullPath, 'e2e');

  console.log(`\nGenerating e2e files for ${app.name}...`);

  // Create e2e directory
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
    console.log(`  ✓ Created ${app.path}/e2e/`);
  }

  // Copy base templates
  const baseTemplates = [
    { src: 'playwright.config.js.template', dest: 'playwright.config.js' },
    { src: 'example.spec.js.template', dest: 'example.spec.js' },
    { src: 'mocks.yaml.template', dest: 'mocks.yaml' },
    { src: 'README.md.template', dest: 'README.md' },
  ];

  for (const { src, dest } of baseTemplates) {
    const destPath = path.join(e2eDir, dest);
    if (copyTemplate(src, destPath)) {
      console.log(`  ✓ Created ${app.path}/e2e/${dest}`);
    } else {
      console.log(`  - Skipped ${app.path}/e2e/${dest} (already exists)`);
    }
  }

  // MongoDB-specific files
  if (useMongoDB) {
    // Create fixtures.js that merges ldf and mdb
    const fixturesPath = path.join(e2eDir, 'fixtures.js');
    if (copyTemplate('fixtures.js.template', fixturesPath)) {
      console.log(`  ✓ Created ${app.path}/e2e/fixtures.js`);
    } else {
      console.log(`  - Skipped ${app.path}/e2e/fixtures.js (already exists)`);
    }

    // Create mongodb.spec.js example
    const mongoSpecPath = path.join(e2eDir, 'mongodb.spec.js');
    if (copyTemplate('mongodb.spec.js.template', mongoSpecPath)) {
      console.log(`  ✓ Created ${app.path}/e2e/mongodb.spec.js`);
    } else {
      console.log(`  - Skipped ${app.path}/e2e/mongodb.spec.js (already exists)`);
    }

    // Create snaps/ folder with .gitkeep
    const snapsDir = path.join(e2eDir, 'snaps');
    if (!fs.existsSync(snapsDir)) {
      fs.mkdirSync(snapsDir, { recursive: true });
      fs.writeFileSync(path.join(snapsDir, '.gitkeep'), '');
      console.log(`  ✓ Created ${app.path}/e2e/snaps/`);
    }

    // Create .env.e2e template
    const envPath = path.join(e2eDir, '.env.e2e');
    if (copyTemplate('env.e2e.template', envPath)) {
      console.log(`  ✓ Created ${app.path}/e2e/.env.e2e`);
    } else {
      console.log(`  - Skipped ${app.path}/e2e/.env.e2e (already exists)`);
    }
  }

  // Update package.json with e2e scripts
  updatePackageJson({ appPath: app.path, cwd, useExperimental, useMongoDB });
}

export default generateFiles;
