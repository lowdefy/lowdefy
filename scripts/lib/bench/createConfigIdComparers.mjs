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

import compareFileBytes from './compareFileBytes.mjs';
import compareMultisets from './compareMultisets.mjs';
import compareText from './compareText.mjs';
import createIdDescriber from './createIdDescriber.mjs';
import formatMultisetComparison from './formatMultisetComparison.mjs';
import readKeyMaps from './readKeyMaps.mjs';
import replaceConfigIds from './replaceConfigIds.mjs';

// The compareBuilds comparers for --keymap: key and ref ids are compared by
// what they point at, not by their values, so a build that numbers the same
// config differently is still identical. Every JSON artifact is compared with
// its ~k and ~r ids replaced by their config locations, and keyMap.json and
// refMap.json as the lists of locations their entries describe, ids aside.
// resolve holds each side's own resolveConfigLocation, so each key map is read
// by the Lowdefy that wrote it. Returns { comparers, defaultComparer }.
function createConfigIdComparers({ logger, resolve }) {
  // Each side's maps are read once, on first use: a large app's are hundreds of MB.
  const loaded = new Map();

  function load({ side, role }) {
    if (!loaded.has(side.serverDirectory)) {
      const maps = readKeyMaps({ location: path.join(side.serverDirectory, 'build') });
      loaded.set(side.serverDirectory, {
        ...maps,
        describer: createIdDescriber({ ...maps, resolve: resolve[role] }),
      });
    }
    return loaded.get(side.serverDirectory);
  }

  function describeArtifact({ buffer, role, side }) {
    const value = JSON.parse(side.replacePath(buffer.toString('utf8')));
    const { describer } = load({ side, role });
    return JSON.stringify(replaceConfigIds({ value, describer }));
  }

  async function compareArtifact({ file, baseline, current }) {
    if (!file.endsWith('.json')) {
      return compareFileBytes({ file, baseline, current });
    }
    const left = fs.readFileSync(path.join(baseline.serverDirectory, file));
    const right = fs.readFileSync(path.join(current.serverDirectory, file));
    if (left.equals(right)) {
      return { identical: true, lines: [] };
    }
    return compareText({
      file,
      baseline: describeArtifact({ buffer: left, role: 'baseline', side: baseline }),
      current: describeArtifact({ buffer: right, role: 'current', side: current }),
    });
  }

  function createMapComparer({ describe, file, noun }) {
    return async function compareMap({ baseline, current }) {
      const comparison = compareMultisets({
        baseline: describe(load({ side: baseline, role: 'baseline' })),
        current: describe(load({ side: current, role: 'current' })),
      });
      const lines = formatMultisetComparison({ comparison, noun });
      logger.info(`${file} by meaning: ${lines[0]}`);
      return { identical: comparison.identical, lines };
    };
  }

  return {
    comparers: {
      'build/keyMap.json': createMapComparer({
        describe: ({ keyMap, describer }) => Object.keys(keyMap).map(describer.describeKey),
        file: 'keyMap.json',
        noun: 'key ids',
      }),
      'build/refMap.json': createMapComparer({
        describe: ({ refMap, describer }) => Object.keys(refMap).map(describer.describeRef),
        file: 'refMap.json',
        noun: 'ref ids',
      }),
    },
    defaultComparer: compareArtifact,
  };
}

export default createConfigIdComparers;
