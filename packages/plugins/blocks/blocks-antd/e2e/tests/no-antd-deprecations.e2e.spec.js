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
import { fileURLToPath } from 'url';
import { expect, test } from '@playwright/test';
import { navigateToTestPage } from '@lowdefy/block-dev-e2e';

// antd prefixes every warning it raises with `[antd: <Component>]`, and batches deprecations
// into a single `[antd] There exists deprecated usage in your code:`.
//
// This spec cannot catch a deprecated prop today: antd raises those warnings only in a
// development build, and @lowdefy/block-dev-e2e's createPlaywrightConfig runs the app through
// `lowdefy build` + `lowdefy start` — a production build, where antd compiles the warnings out.
// The deterministic gate is no-deprecated-antd-props.e2e.spec.js, which reads the block sources
// against antd's own `@deprecated` annotations. What this spec still earns: it fails on any
// `[antd` console message that does survive a production build (invalid props, render warnings),
// and it fails loudly rather than silently if a page stops rendering.
//
// To make it bite on deprecations, createPlaywrightConfig would need a dev-server mode — a
// webServer command running `lowdefy dev --port <port>` instead of build + start. It has no such
// option today (packages/utils/block-dev-e2e/src/createPlaywrightConfig.js).
const ANTD_MESSAGE = /\[antd[:\]]/;

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lowdefyYamlPath = path.join(appDir, 'app', 'lowdefy.yaml');

function readPageIds() {
  const lowdefyYaml = fs.readFileSync(lowdefyYamlPath, 'utf8');
  const refs = [...lowdefyYaml.matchAll(/^\s*-\s*_ref:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  return refs.map((ref) => {
    const pageYaml = fs.readFileSync(path.resolve(appDir, 'app', ref), 'utf8');
    const idMatch = pageYaml.match(/^id:\s*(\S+)\s*$/m);
    if (!idMatch) {
      throw new Error(`No page id found in "${ref}".`);
    }
    return idMatch[1];
  });
}

const pageIds = readPageIds();

test.describe('no antd deprecation warnings', () => {
  for (const pageId of pageIds) {
    test(`page "${pageId}" logs no antd warnings to the console`, async ({ page }) => {
      const antdMessages = [];
      page.on('console', (message) => {
        const text = message.text();
        if (ANTD_MESSAGE.test(text)) {
          antdMessages.push(text);
        }
      });

      await navigateToTestPage(page, pageId);
      await page.waitForLoadState('networkidle');
      // A page that failed to render would log nothing and pass vacuously.
      await expect(page.locator(`[id="${pageId}"]`)).toBeAttached();

      expect(antdMessages).toEqual([]);
    });
  }
});
