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

import mcpJson from '../../lib/build/mcp.js';

import collectChunkClosure from './collectChunkClosure.js';
import collectEntryCss from './collectEntryCss.js';
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
  const entryFiles = new Set([...entryJs, ...entryCss]);
  // Every icon the app bundles: preloaded only for a page whose Dynamic
  // content loads them all before its first render.
  const iconsJs = new Set();
  const iconsCss = new Set();
  collectChunkClosure({ manifest, key: 'build/plugins/icons.js', js: iconsJs, css: iconsCss });
  // The entry an MCP App view's loader starts (routes/viewBoot.js), with the
  // stylesheets of everything it imports statically: the loader has no HTML of
  // this build to link them from. The client build has the entry exactly when
  // the app has a view (vite.config.js reads the same mcp.json), so an app
  // with a view and no entry was not built by this build. null for an app
  // without a view, which has no view routes.
  let view = null;
  if (mcpJson.views.configured === true) {
    const viewEntry = manifest['client/view.jsx'];
    if (!viewEntry) {
      throw new LowdefyInternalError(
        'Vite manifest has no "client/view.jsx" entry for an app with an MCP view. Run the client build after the Lowdefy build.'
      );
    }
    view = {
      js: viewEntry.file,
      css: [...collectEntryCss({ manifest, key: 'client/view.jsx' })],
    };
  }
  assets = {
    js: entry.file,
    // The entry's stylesheets and those of the chunks it imports statically,
    // in Vite's order (collectEntryCss). A second entry (the view's) moves
    // the code the two share, and its CSS, into chunks of its own.
    css: [...collectEntryCss({ manifest, key: 'client/main.jsx' })],
    icons: {
      js: [...iconsJs].filter((file) => !entryFiles.has(file)),
      css: [...iconsCss].filter((file) => !entryFiles.has(file)),
    },
    imports: (entry.imports ?? []).map((key) => manifest[key]?.file).filter(Boolean),
    pageTypes: collectPageTypesAssets({ manifest, entryFiles }),
    view,
  };
  return assets;
}

export default getAssets;
