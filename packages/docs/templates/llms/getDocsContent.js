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
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// @lowdefy/docs-content is a devDependency of @lowdefy/docs (see getDocsManifest.js in
// packages/servers/server-dev for the same resolution pattern used at runtime).
function getDocsContent() {
  try {
    const manifestPath = require.resolve('@lowdefy/docs-content/index.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return { manifest, contentDir: path.dirname(manifestPath) };
  } catch {
    return null;
  }
}

export default getDocsContent;
