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

// User JavaScript (resolvers, .js content refs) imports by absolute file URL
// with a cache-busting query so dev rebuilds pick up edits — walker
// getUserJavascriptFunction parity, including the error message.
async function importUserFunction({ configDir, filePath }) {
  try {
    const fileUrl = pathToFileURL(path.resolve(configDir ?? '', filePath));
    fileUrl.searchParams.set('t', Date.now());
    return (await import(/* @vite-ignore */ fileUrl.href)).default;
  } catch (error) {
    throw new ConfigError(`Error importing ${filePath}.`, { cause: error, filePath });
  }
}

export default importUserFunction;
