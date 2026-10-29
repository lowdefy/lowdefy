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

import path from 'node:path';

import compareKeyMaps from './compareKeyMaps.mjs';
import formatKeyMapComparison from './formatKeyMapComparison.mjs';
import readKeyMaps from './readKeyMaps.mjs';

// The compareBuilds comparer for build/keyMap.json under --keymap: the two
// maps must say the same by meaning, each read with its own side's
// resolveConfigLocation and that side's refMap.json. refMap.json itself is
// still compared byte for byte.
function createKeyMapComparer({ logger, resolve }) {
  return async function compareKeyMapFiles({ baseline, current }) {
    const readSide = (side) => readKeyMaps({ location: path.join(side.serverDirectory, 'build') });
    const comparison = compareKeyMaps({
      old: { ...readSide(baseline), resolve: resolve.baseline },
      new: { ...readSide(current), resolve: resolve.current },
    });
    const lines = formatKeyMapComparison({ comparison });
    logger.info(`keyMap.json by meaning: ${lines[0]}`);
    return { identical: comparison.identical, lines };
  };
}

export default createKeyMapComparer;
