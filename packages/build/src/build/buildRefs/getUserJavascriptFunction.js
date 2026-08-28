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

async function getUserJavascriptFunction({ context, filePath }) {
  try {
    const fileUrl = pathToFileURL(path.resolve(context.directories.config, filePath));
    // Bust Node.js module cache so edits to resolver/transformer JS files are
    // picked up during dev rebuilds. Each import gets a unique URL.
    fileUrl.searchParams.set('t', Date.now());
    // webpackIgnore tells Next.js webpack to leave this dynamic import alone
    // when bundling server-dev API routes — otherwise webpack rewrites import()
    // into __webpack_require__() which can't handle file:// URLs for loading
    // user-provided resolver/transformer JS files from the config directory.
    return (await import(/* webpackIgnore: true */ /* @vite-ignore */ fileUrl.href)).default;
  } catch (error) {
    throw new ConfigError(`Error importing ${filePath}.`, { cause: error, filePath });
  }
}

export default getUserJavascriptFunction;
