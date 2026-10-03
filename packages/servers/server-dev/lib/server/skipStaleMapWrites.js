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

const mapFiles = new Set(['keyMap.json', 'refMap.json']);
const jsMapFiles = new Set([
  'plugins/operators/clientJsMap.js',
  'plugins/operators/serverJsMap.js',
]);

function isMapFile(filePath) {
  return mapFiles.has(filePath) || filePath.startsWith('jitMaps/');
}

function readLiveKeyPrefix({ buildDirectory }) {
  return JSON.parse(fs.readFileSync(path.join(buildDirectory, 'idCounter.json'), 'utf8')).prefix;
}

// A config rebuild publishes new maps while a page build that started against the
// previous build may still be running. That build's keyMap and refMap describe the
// previous build, so writing them would replace the new maps, and errors would resolve
// against the wrong build until the next rebuild. Its jitMaps/ files would outlive the
// publish that cleared the old build's. The build's key prefix names the build
// a context was created from.
//
// The JS map files are written whole from a context's jsMap, so a page build on
// a context that is no longer the kept one (a config publish, or the map budget,
// discarded it) would replace the entries pages built on the newer context
// added. Pages built on the discarded context are rebuilt on their next request
// or API call, which writes their entries again.
function skipStaleMapWrites({ buildDirectory, context, keyPrefix, isKeptContext }) {
  const writeBuildArtifact = context.writeBuildArtifact;
  context.writeBuildArtifact = async (filePath, content, options) => {
    if (isMapFile(filePath) && readLiveKeyPrefix({ buildDirectory }) !== keyPrefix) {
      return;
    }
    if (
      jsMapFiles.has(filePath) &&
      (!isKeptContext() || readLiveKeyPrefix({ buildDirectory }) !== keyPrefix)
    ) {
      return;
    }
    await writeBuildArtifact(filePath, content, options);
  };
}

export default skipStaleMapWrites;
