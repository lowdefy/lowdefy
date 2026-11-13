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
import { searchForWorkspaceRoot } from 'vite';

// The folders Vite may serve files from. By default that is the server directory's workspace,
// which holds every installed plugin. A linked package (a link: dependency, such as every
// @lowdefy package when the server runs on a Lowdefy checkout, or a local plugin) resolves to
// its real path outside it. Vite still serves its JavaScript modules, but refuses ?url, ?raw and
// .wasm imports from outside the allowed folders and sends the raw file instead, so a plugin
// that imports an asset by URL (QRScanner's zxing .wasm) breaks. Each linked package's workspace
// is allowed too. A link to a folder that does not exist (a local plugin moved or not checked
// out) has nothing to serve and is skipped: a throw here would stop the whole dev server with an
// ENOENT that never names the dependency, where only that plugin's imports fail otherwise.
function createDevServerFsAllow({ dependencies, root }) {
  const linkedWorkspaces = Object.values(dependencies ?? {})
    .filter((version) => version.startsWith('link:'))
    .map((version) => path.resolve(root, version.slice('link:'.length)))
    .filter((linkPath) => fs.existsSync(linkPath))
    .map((linkPath) => searchForWorkspaceRoot(fs.realpathSync(linkPath)));
  return [...new Set([searchForWorkspaceRoot(root), ...linkedWorkspaces])];
}

export default createDevServerFsAllow;
