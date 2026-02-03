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

import { test as base, expect } from '@playwright/test';

import createHelperRegistry from '../proxy/createHelperRegistry.js';
import createPageManager from '../proxy/createPageManager.js';
import { generateManifest, loadManifest } from '../testPrep/generateManifest.js';

// Create test with ldf fixture
export const test = base.extend({
  // Worker-scoped fixtures (shared across tests in a worker)
  helperRegistry: [
    async (_fixtures, use) => {
      const registry = createHelperRegistry();
      await use(registry);
    },
    { scope: 'worker' },
  ],

  manifest: [
    async (_fixtures, use) => {
      // Load manifest from build directory
      // Generate lazily if it doesn't exist (webServer has built by now)
      const buildDir = process.env.LOWDEFY_BUILD_DIR || '.lowdefy/server/build';
      const manifestPath = path.join(buildDir, 'e2e-manifest.json');

      if (!fs.existsSync(manifestPath)) {
        generateManifest({ buildDir });
      }

      const manifest = loadManifest({ buildDir });
      await use(manifest);
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixture - provides the ldf helper
  ldf: async ({ page, manifest, helperRegistry }, use) => {
    const pageManager = createPageManager({ page, manifest, helperRegistry });
    await use(pageManager);
  },
});

export { expect };
