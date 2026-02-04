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

import extractBlockMap from './extractBlockMap.js';

function generateManifest({ buildDir = '.lowdefy' }) {
  const typesPath = path.join(buildDir, 'types.json');
  if (!fs.existsSync(typesPath)) {
    throw new Error(`Build artifacts not found at ${buildDir}. Run 'lowdefy build' first.`);
  }

  const types = JSON.parse(fs.readFileSync(typesPath, 'utf-8'));
  const pagesDir = path.join(buildDir, 'pages');

  const manifest = { pages: {} };

  if (fs.existsSync(pagesDir)) {
    for (const pageId of fs.readdirSync(pagesDir)) {
      const pageConfigPath = path.join(pagesDir, pageId, `${pageId}.json`);
      if (fs.existsSync(pageConfigPath)) {
        const pageConfig = JSON.parse(fs.readFileSync(pageConfigPath, 'utf-8'));
        manifest.pages[pageId] = extractBlockMap({
          pageConfig,
          typesBlocks: types.blocks ?? {},
        });
      }
    }
  }

  const manifestPath = path.join(buildDir, 'e2e-manifest.json');
  const tempPath = path.join(buildDir, `e2e-manifest.${process.pid}.tmp`);

  // Write to temp file first, then rename atomically to prevent race conditions
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2));
  fs.renameSync(tempPath, manifestPath);

  return manifest;
}

function loadManifest({ buildDir = '.lowdefy' } = {}) {
  const manifestPath = path.join(buildDir, 'e2e-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `E2E manifest not found at ${manifestPath}. Run test prep or generateManifest() first.`
    );
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export { generateManifest, loadManifest };
export default generateManifest;
