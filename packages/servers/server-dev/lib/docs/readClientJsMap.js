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
import { evaluateJsModule } from '@lowdefy/journey-headless';

import createLogger from '../server/log/createLogger.js';

const logger = createLogger();

// The client map last read, with the size and modified time of the file it was read from.
let last = null;

// The build's client _js map, plugins/operators/clientJsMap.js, as it is on disk now: the headless
// host's client plugins are imported once per process (Node caches the import), while a rebuild of
// the config (a lowdefy.yaml edit, which needs no restart) rewrites the file with the app events'
// _js, as Vite brings the browser the new file. Read again only once the file changes, as the server
// reads serverJsMap.js (loadDynamicJsMap). A file that fails to read or evaluate, as one still
// being written can, is logged and the last good map (`fallback` before any) keeps serving.
function readClientJsMap({ buildDirectory, fallback }) {
  const filePath = path.join(buildDirectory, 'plugins', 'operators', 'clientJsMap.js');
  try {
    const { mtimeMs, size } = fs.statSync(filePath);
    if (
      last !== null &&
      last.filePath === filePath &&
      last.mtimeMs === mtimeMs &&
      last.size === size
    ) {
      return last.jsMap;
    }
    const jsMap = evaluateJsModule(fs.readFileSync(filePath, 'utf8'));
    last = { filePath, jsMap, mtimeMs, size };
    return jsMap;
  } catch (error) {
    logger.error(error);
    return last?.filePath === filePath ? last.jsMap : fallback;
  }
}

export default readClientJsMap;
