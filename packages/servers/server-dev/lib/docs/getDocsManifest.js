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
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

let manifest;

function getDocsManifest() {
  if (manifest !== undefined) {
    return manifest;
  }
  try {
    const manifestPath = require.resolve('@lowdefy/docs-content/index.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.contentDir = path.dirname(manifestPath);
  } catch {
    // docs-content not installed — core docs unavailable, plugin data still served.
    manifest = null;
  }
  return manifest;
}

export default getDocsManifest;
