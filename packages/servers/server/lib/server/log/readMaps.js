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

import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';

const gunzip = promisify(zlib.gunzip);

// One load per process, shared by every error: the maps of a large app take
// over a second to parse, and the shared fileCache LRU would evict them.
// The promise is kept, not the value, so errors that arrive together while
// the first load runs share its read and parse.
let loading = null;
let warned = false;

async function readGzippedJson(filePath) {
  const compressed = await fs.readFile(filePath);
  const json = await gunzip(compressed);
  // JSON.parse, not serializer: the short key map entries carry no serializer
  // markers, and JSON.parse is about 5 times faster on a large map.
  return JSON.parse(json.toString('utf8'));
}

async function loadMaps({ buildDirectory, logger }) {
  try {
    const [keyMap, refMap] = await Promise.all([
      readGzippedJson(path.join(buildDirectory, 'keyMap.json.gz')),
      readGzippedJson(path.join(buildDirectory, 'refMap.json.gz')),
    ]);
    return { keyMap, refMap };
  } catch (error) {
    // A build without the maps (one from before they were gzipped, or a deploy
    // that strips them) stays that way for the life of the process, so the
    // missing maps are remembered and no later error touches the filesystem.
    if (error.code === 'ENOENT') {
      return { keyMap: null, refMap: null };
    }
    // Any other fault may be transient, so the next error reads again.
    loading = null;
    if (!warned) {
      warned = true;
      logger.warn(
        { err: error },
        'Could not read keyMap.json.gz and refMap.json.gz; errors are logged without their config location.'
      );
    }
    return { keyMap: null, refMap: null };
  }
}

// The production server's key and ref maps, read from the gzipped copies the
// server build writes. Only the error path calls it, on the first error that
// carries a configKey.
function readMaps({ buildDirectory, logger }) {
  if (loading === null) {
    loading = loadMaps({ buildDirectory, logger });
  }
  return loading;
}

export default readMaps;
