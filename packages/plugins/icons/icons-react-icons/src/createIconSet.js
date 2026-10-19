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

import { readFile } from 'fs/promises';

import packsForIconName from './packsForIconName.js';

function createIconSet({ dataDirectory }) {
  const packs = new Map();

  async function readJson(fileName) {
    return JSON.parse(await readFile(new URL(fileName, dataDirectory), 'utf8'));
  }

  function readPack(pack) {
    if (!packs.has(pack)) {
      packs.set(pack, readJson(`${pack}.json`));
    }
    return packs.get(pack);
  }

  async function listIcons() {
    return readJson('names.json');
  }

  async function loadIcons({ names }) {
    const icons = {};
    for (const name of names) {
      for (const pack of packsForIconName({ name })) {
        const packIcons = await readPack(pack);
        if (packIcons[name]) {
          // Packs stay cached for later calls, so callers get a copy they can change.
          icons[name] = structuredClone(packIcons[name]);
          break;
        }
      }
    }
    return icons;
  }

  return { listIcons, loadIcons };
}

export default createIconSet;
