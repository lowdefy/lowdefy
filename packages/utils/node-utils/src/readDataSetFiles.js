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

import listDataSetFiles from './listDataSetFiles.js';
import readDataSetFile from './readDataSetFile.js';

// The named data set's file and every file it extends, each read once, in load order: a data set's
// extended sets come before it, in the order its extends lists them. A set reached twice (two sets
// that both extend base) loads once, at its first place, so a fixture without an _id is not
// inserted twice.
async function readDataSetFiles({ configDirectory, name }) {
  const allFiles = await listDataSetFiles({ configDirectory });
  const declared = new Set(allFiles.map((file) => file.name));
  const ordered = [];
  const loaded = new Set();

  async function visit({ name: current, chain }) {
    const file = await readDataSetFile({ configDirectory, name: current, allFiles });
    const trail = [...chain, current];
    for (const base of file.extends) {
      if (trail.includes(base)) {
        file.fail(`extends "${base}", which makes a cycle: ${[...trail, base].join(' -> ')}.`);
      }
      if (!declared.has(base)) {
        file.fail(
          `extends "${base}", which is not in tests/data. Declared: ${[...declared].join(', ')}.`
        );
      }
      if (!loaded.has(base)) {
        await visit({ name: base, chain: trail });
      }
    }
    loaded.add(current);
    ordered.push(file);
  }

  await visit({ name, chain: [] });
  return ordered;
}

export default readDataSetFiles;
