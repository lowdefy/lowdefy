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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const cwd = process.cwd();
  const e2eDir = path.join(cwd, 'e2e');

  console.log('Setting up Lowdefy e2e testing...\n');

  // Create e2e directory
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
    console.log('Created e2e/');
  }

  // Copy templates
  const templates = [
    { src: 'playwright.config.js.template', dest: 'playwright.config.js' },
    { src: 'example.spec.js.template', dest: 'example.spec.js' },
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

  console.log('\n✓ E2E testing setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Install dependencies: pnpm add -D @lowdefy/e2e-utils @playwright/test');
  console.log('  2. Install browsers: npx playwright install chromium');
  console.log('  3. Run tests: pnpm e2e');
  console.log('  4. Or use UI mode: pnpm e2e:ui');
}

init().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
