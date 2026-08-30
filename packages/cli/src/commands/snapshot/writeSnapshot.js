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

import normalizeDom from './normalizeDom.js';
import snapshotPaths from './snapshotPaths.js';

// Sorted keys so two captures of the same state serialise identically whatever
// order the engine set them in.
function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortKeys(value[key]);
        return sorted;
      }, {});
  }
  return value;
}

// writeSnapshot commits one snapshot as three files formatted for a readable
// diff: the PNG as-is, the DOM normalised one element per line, the state as
// pretty-printed JSON with sorted keys.
function writeSnapshot({ configDirectory, target, snapshot }) {
  const paths = snapshotPaths({ configDirectory, target });
  fs.mkdirSync(paths.goldenDirectory, { recursive: true });
  fs.writeFileSync(paths.screenshot, Buffer.from(snapshot.screenshot, 'base64'));
  fs.writeFileSync(paths.dom, `${normalizeDom({ dom: snapshot.dom })}\n`);
  fs.writeFileSync(paths.state, `${JSON.stringify(sortKeys(snapshot.state ?? {}), null, 2)}\n`);
  return paths;
}

export { sortKeys };
export default writeSnapshot;
