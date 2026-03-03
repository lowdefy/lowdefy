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
import path from 'path';
import { pathToFileURL } from 'url';
import { ConfigError } from '@lowdefy/errors';

// Create a native import() that survives webpack bundling. When this module is
// bundled by Next.js webpack for server-dev API routes, webpack transforms
// import() into __webpack_require__() which can't handle file:// URLs for
// loading user-provided resolver and transformer JS files from the config
// directory. The Function constructor creates the import call at runtime,
// bypassing webpack's static analysis.
const nativeImport = new Function('specifier', 'return import(specifier)');

async function getUserJavascriptFunction({ context, filePath }) {
  try {
    return (await nativeImport(pathToFileURL(path.join(context.directories.config, filePath))))
      .default;
  } catch (error) {
    throw new ConfigError(`Error importing ${filePath}.`, { cause: error, filePath });
  }
}

export default getUserJavascriptFunction;
