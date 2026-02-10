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
import { createMockManager, loadStaticMocks } from '../mocking/index.js';

// Create test with ldf fixture
export const test = base.extend({
  // Worker-scoped fixtures (shared across tests in a worker)
  helperRegistry: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const buildDir = process.env.LOWDEFY_BUILD_DIR || '.lowdefy/server/build';
      // serverDir is the parent of buildDir (e.g., .lowdefy/server)
      const serverDir = path.dirname(buildDir);
      const registry = createHelperRegistry({ serverDir });
      await use(registry);
    },
    { scope: 'worker' },
  ],

  staticMocks: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const mocksFile = process.env.LOWDEFY_E2E_MOCKS_FILE;
      const mocks = loadStaticMocks(mocksFile);
      await use(mocks);
    },
    { scope: 'worker' },
  ],

  manifest: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const buildDir = process.env.LOWDEFY_BUILD_DIR || '.lowdefy/server/build';
      const manifestPath = path.join(buildDir, 'e2e-manifest.json');
      const lockPath = path.join(buildDir, 'e2e-manifest.lock');
      const lockTimeout = 30000;
      const lockStaleMs = 60000;

      const isLockStale = () => {
        try {
          const stat = fs.statSync(lockPath);
          return Date.now() - stat.mtimeMs > lockStaleMs;
        } catch {
          return false;
        }
      };

      const removeStaleLock = () => {
        try {
          if (isLockStale()) {
            fs.unlinkSync(lockPath);
            return true;
          }
        } catch {
          // Another process may have removed it
        }
        return false;
      };

      const ensureManifest = async () => {
        if (fs.existsSync(manifestPath)) {
          return;
        }

        const start = Date.now();
        while (Date.now() - start < lockTimeout) {
          try {
            fs.writeFileSync(lockPath, `${process.pid}:${Date.now()}`, { flag: 'wx' });

            try {
              if (!fs.existsSync(manifestPath)) {
                generateManifest({ buildDir });
              }
            } finally {
              try {
                fs.unlinkSync(lockPath);
              } catch {
                // Ignore
              }
            }
            return;
          } catch (err) {
            if (err.code === 'EEXIST') {
              removeStaleLock();
              await new Promise((r) => setTimeout(r, 100));
            } else {
              throw err;
            }
          }
        }

        if (!fs.existsSync(manifestPath)) {
          throw new Error(
            `Timed out waiting for e2e manifest generation after ${lockTimeout}ms. ` +
              `Lock file may be stale: ${lockPath}`
          );
        }
      };

      await ensureManifest();
      const manifest = loadManifest({ buildDir });
      await use(manifest);
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixture - provides the ldf helper
  ldf: async ({ page, manifest, helperRegistry, staticMocks }, use) => {
    const mockManager = createMockManager({ page });
    await mockManager.applyStaticMocks(staticMocks);
    const pageManager = createPageManager({ page, manifest, helperRegistry, mockManager });
    await use(pageManager);
    await mockManager.cleanup();
  },
});

export { expect };
