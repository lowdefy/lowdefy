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

import applyIgnore from './applyIgnore.js';
import normalizeDom from './normalizeDom.js';
import normalizeState from './normalizeState.js';
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
// pretty-printed JSON with sorted keys. The state is written through the same
// ignore and normalisation the comparison applies, so a golden only changes
// when the page's own output does and two --update runs are byte-identical.
function writeSnapshot({ configDirectory, target, snapshot, ignore = [] }) {
  const paths = snapshotPaths({ configDirectory, target });
  const state = normalizeState({ state: applyIgnore({ state: snapshot.state, ignore }) });
  fs.mkdirSync(paths.goldenDirectory, { recursive: true });
  fs.writeFileSync(paths.screenshot, Buffer.from(snapshot.screenshot, 'base64'));
  fs.writeFileSync(paths.dom, `${normalizeDom({ dom: snapshot.dom })}\n`);
  fs.writeFileSync(paths.state, `${JSON.stringify(sortKeys(state), null, 2)}\n`);
  return paths;
}

export { sortKeys };
export default writeSnapshot;
