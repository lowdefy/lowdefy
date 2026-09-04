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

// The Vite manifest is read once at startup — deploys start a new server
// process after `vite build` completes, so assets never change at runtime.
// In-place deploys must build before restarting (documented).
let assets = null;

// Vite keys a chunk by its source path relative to the project root, so a
// page's type-import module is keyed by the artifact the build wrote.
const pageModulePrefix = 'build/plugins/pages/';

// A page module is fetched by the page's own dynamic import, one round trip
// after the entry chunk runs. Preloading the chunk and everything it imports
// statically starts those fetches with the entry's, so the first paint does
// not wait for them. Dynamic imports of a page chunk are deliberately left
// out — they are the parts the page loads only if it needs them.
function collectChunkFiles({ files, key, manifest, visited }) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) return;
  files.push(chunk.file);
  (chunk.imports ?? []).forEach((imported) =>
    collectChunkFiles({ files, key: imported, manifest, visited })
  );
}

function getPageFiles({ entryKeys, manifest }) {
  const pages = {};
  Object.keys(manifest).forEach((key) => {
    if (!key.startsWith(pageModulePrefix) || !key.endsWith('.js')) return;
    const pageId = key.slice(pageModulePrefix.length, -'.js'.length);
    if (pageId === 'index') return;
    const files = [];
    // The entry and the chunks it already preloads are not repeated.
    collectChunkFiles({ files, key, manifest, visited: new Set(entryKeys) });
    pages[pageId] = files;
  });
  return pages;
}

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
  assets = {
    js: entry.file,
    css: entry.css ?? [],
    imports: (entry.imports ?? []).map((key) => manifest[key]?.file).filter(Boolean),
    pages: getPageFiles({
      entryKeys: ['client/main.jsx', ...(entry.imports ?? [])],
      manifest,
    }),
  };
  return assets;
}

export default getAssets;
