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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// The one place a build loads app code (ref resolvers, transformers, _ref to a
// .js file, module resolvers, the global ref resolver), so the dev server can
// tell which page builds ran code it cannot see into.
function createImportAppCode({ directories }) {
  return async function importAppCode(filePath) {
    const absolutePath = path.resolve(directories.config, filePath);
    const fileUrl = pathToFileURL(absolutePath);
    // A dev server rebuilds with the same process, so an edited file needs a new
    // module URL. The URL is keyed on the file's content: an unchanged file
    // reuses its loaded module, and the key is not Vite's `t=<timestamp>` HMR
    // query, which Vite's SSR module runner strips when it loads the build
    // package from source (a linked workspace) and then serves its cached module.
    const content = await fs.promises.readFile(absolutePath);
    fileUrl.searchParams.set(
      'lowdefy-app-code',
      crypto.createHash('sha1').update(content).digest('hex')
    );
    // webpackIgnore and @vite-ignore keep bundlers from rewriting this dynamic
    // import of a file:// URL into a bundled require of user code.
    const module = await import(/* webpackIgnore: true */ /* @vite-ignore */ fileUrl.href);
    return module.default;
  };
}

export default createImportAppCode;
