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
import { serializer } from '@lowdefy/helpers';

async function readJson(filePath) {
  return serializer.deserializeFromString(await fs.readFile(filePath, 'utf8'));
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    // A jitMaps file can be pruned between the listing and the read.
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function listJitMapsFiles(jitMapsDirectory) {
  try {
    return await fs.readdir(jitMapsDirectory);
  } catch (error) {
    // No page has been built since the last config build.
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// <childId>-<generation>-<write>.json. Files of one build context can repeat
// an entry (see writeJitMaps in @lowdefy/build), and the later write is the
// more complete one, so files are applied in write order.
function compareWriteOrder(a, b) {
  const [childA, generationA, writeA] = path.basename(a, '.json').split('-');
  const [childB, generationB, writeB] = path.basename(b, '.json').split('-');
  if (childA !== childB) {
    return childA < childB ? -1 : 1;
  }
  return Number(generationA) - Number(generationB) || Number(writeA) - Number(writeB);
}

// The dev server's key and ref maps: the config build's keyMap.json and
// refMap.json, plus the entries every retained JIT page build wrote to
// jitMaps/. Read in full on each call; only the error path and the dev tools
// call it.
async function readMergedMaps({ buildDirectory }) {
  const jitMapsDirectory = path.join(buildDirectory, 'jitMaps');
  const [keyMap, refMap, files] = await Promise.all([
    readJson(path.join(buildDirectory, 'keyMap.json')),
    readJson(path.join(buildDirectory, 'refMap.json')),
    listJitMapsFiles(jitMapsDirectory),
  ]);
  const merged = { keyMap, refMap };
  const jitMaps = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .sort(compareWriteOrder)
      .map((file) => readJsonIfExists(path.join(jitMapsDirectory, file)))
  );
  for (const maps of jitMaps.filter((entry) => entry !== null)) {
    Object.assign(merged.keyMap, maps.keyMap);
    Object.assign(merged.refMap, maps.refMap);
  }
  return merged;
}

export default readMergedMaps;
