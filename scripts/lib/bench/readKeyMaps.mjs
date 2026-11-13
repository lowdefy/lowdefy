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

const MAP_FILES = ['keyMap.json', 'refMap.json'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Reads a key map and its ref map from a build folder holding keyMap.json and
// refMap.json, or from a build fixture's snapshot.json, which holds every
// artifact parsed, by file name. Each map is read once, with JSON.parse.
function readKeyMaps({ location }) {
  if (!fs.existsSync(location)) {
    throw new Error(`No build folder or snapshot.json at ${location}.`);
  }
  if (fs.statSync(location).isDirectory()) {
    const missing = MAP_FILES.filter((file) => !fs.existsSync(path.join(location, file)));
    if (missing.length > 0) {
      throw new Error(`${location} has no ${missing.join(' or ')}.`);
    }
    return {
      keyMap: readJson(path.join(location, 'keyMap.json')),
      refMap: readJson(path.join(location, 'refMap.json')),
    };
  }
  const snapshot = readJson(location);
  const missing = MAP_FILES.filter((file) => typeof snapshot[file] !== 'object');
  if (missing.length > 0) {
    throw new Error(`${location} holds no ${missing.join(' or ')}.`);
  }
  return { keyMap: snapshot['keyMap.json'], refMap: snapshot['refMap.json'] };
}

export default readKeyMaps;
