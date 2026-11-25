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
import { type } from '@lowdefy/helpers';

import collectSecretNames from './collectSecretNames.js';

// The secret names one JSON artifact's _secret operators read. A file that never mentions the
// operator is not parsed.
function readFileSecretNames({ filePath }) {
  const content = fs.readFileSync(filePath, 'utf8');
  const names = new Set();
  if (content.includes('"_secret"')) {
    collectSecretNames({ names, value: JSON.parse(content) });
  }
  return names;
}

// Every secret a _secret operator names anywhere in the build: connections, endpoint routines,
// page requests, agents and the auth config alike. All JSON artifacts are read, since any of
// them can hold the operator. Plain JSON.parse: only keys and string values matter here, so
// the serializer's markers can stay as they are.
//
// `cache`, a Map kept between calls, is for a build that changes while it is read, as the dev
// server's does when it builds pages on demand: each file's names are kept with its size and
// modified time, and a file is read again only once either changes.
function readBuildSecretNames({ directories, cache }) {
  const names = new Set();
  const seen = new Set();
  fs.readdirSync(directories.build, { recursive: true })
    .filter((filePath) => filePath.endsWith('.json'))
    .forEach((filePath) => {
      const fullPath = path.join(directories.build, filePath);
      let fileNames;
      if (type.isUndefined(cache)) {
        fileNames = readFileSecretNames({ filePath: fullPath });
      } else {
        seen.add(fullPath);
        const { mtimeMs, size } = fs.statSync(fullPath);
        const kept = cache.get(fullPath);
        if (!type.isUndefined(kept) && kept.mtimeMs === mtimeMs && kept.size === size) {
          fileNames = kept.names;
        } else {
          fileNames = readFileSecretNames({ filePath: fullPath });
          cache.set(fullPath, { mtimeMs, names: fileNames, size });
        }
      }
      fileNames.forEach((name) => names.add(name));
    });
  // A file the build removed names nothing any more.
  cache?.forEach((_, fullPath) => {
    if (!seen.has(fullPath)) cache.delete(fullPath);
  });
  return [...names].sort();
}

export default readBuildSecretNames;
