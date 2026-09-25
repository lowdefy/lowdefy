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

import fs from 'node:fs';
import path from 'node:path';

import { LowdefyInternalError } from '@lowdefy/errors';

import collectChunkClosure from './collectChunkClosure.js';
import collectPageTypesAssets from './collectPageTypesAssets.js';

// The Vite manifest is read once at startup — deploys start a new server
// process after `vite build` completes, so assets never change at runtime.
// In-place deploys must build before restarting (documented).
let assets = null;

function getAssets() {
  if (assets) {
    return assets;
  }
  const manifestPath = path.join(process.cwd(), 'dist/client/.vite/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entry = manifest['client/main.jsx'];
  if (!entry) {
    throw new LowdefyInternalError(
      'Vite manifest has no "client/main.jsx" entry. Run the client build before starting the server.'
    );
  }
  const entryJs = new Set();
  const entryCss = new Set();
  collectChunkClosure({ manifest, key: 'client/main.jsx', js: entryJs, css: entryCss });
  assets = {
    js: entry.file,
    css: entry.css ?? [],
    imports: (entry.imports ?? []).map((key) => manifest[key]?.file).filter(Boolean),
    pageTypes: collectPageTypesAssets({
      manifest,
      entryFiles: new Set([...entryJs, ...entryCss]),
    }),
  };
  return assets;
}

export default getAssets;
