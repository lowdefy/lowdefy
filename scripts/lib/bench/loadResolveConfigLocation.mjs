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
import { pathToFileURL } from 'node:url';

// Imports resolveConfigLocation from a checkout's built @lowdefy/errors
// (its packages/utils/errors/dist), so each key map is read by the Lowdefy
// that wrote it.
async function loadResolveConfigLocation({ errorsDirectory }) {
  const entry = path.join(errorsDirectory, 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error(
      `No built @lowdefy/errors at ${errorsDirectory}: expected index.js. Build that checkout first.`
    );
  }
  const { resolveConfigLocation } = await import(pathToFileURL(entry).href);
  if (typeof resolveConfigLocation !== 'function') {
    throw new Error(`${entry} does not export resolveConfigLocation.`);
  }
  return resolveConfigLocation;
}

export default loadResolveConfigLocation;
