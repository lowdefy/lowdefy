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

import { compressBuildMaps } from '@lowdefy/node-utils';

const PLAIN_MAPS = ['keyMap.json', 'refMap.json'];
const GZIPPED_MAPS = ['keyMap.json.gz', 'refMap.json.gz'];

function allExist({ directory, files }) {
  return files.every((file) => fs.existsSync(path.join(directory, file)));
}

// The build writes keyMap.json with JSON.stringify, except an entry whose
// ignored checks (i) are a list: the list is the config's own array, written
// with the serializer's array marker ("i":{"~arr":["state-refs"],"~l":7}).
// Taking those lists back out gives the key map the build held, without the
// serializer's reviver over a large app's million entries.
function parseKeyMap(text) {
  const keyMap = JSON.parse(text);
  for (const id of Object.keys(keyMap)) {
    const checks = keyMap[id].i;
    if (checks !== undefined && checks !== true && Array.isArray(checks['~arr'])) {
      keyMap[id].i = checks['~arr'];
    }
  }
  return keyMap;
}

// Deploy output ships the gzipped error maps the production server reads, and
// leaves out the plain ones (createSkipPlainMapsFilter). A build the client
// build ran with already wrote them, and the copy of the build folder carried
// them over. A config-only build (lowdefy build --no-client-build, as a Vercel
// build runs it) wrote none, so they are written here from the plain maps:
// the same bytes the build would have written. A build folder with no maps at
// all ships none, and its server logs errors without their config location.
async function ensureCompressedMaps({ buildDirectory, outputBuildDirectory, logger }) {
  if (
    allExist({ directory: buildDirectory, files: GZIPPED_MAPS }) ||
    !allExist({ directory: buildDirectory, files: PLAIN_MAPS })
  ) {
    return;
  }
  const [keyMapText, refMapText] = await Promise.all([
    fs.promises.readFile(path.join(buildDirectory, 'keyMap.json'), 'utf8'),
    fs.promises.readFile(path.join(buildDirectory, 'refMap.json'), 'utf8'),
  ]);
  const { keyMapGz, refMapGz } = await compressBuildMaps({
    keyMap: parseKeyMap(keyMapText),
    refMapText,
  });
  await Promise.all([
    fs.promises.writeFile(path.join(outputBuildDirectory, 'keyMap.json.gz'), keyMapGz),
    fs.promises.writeFile(path.join(outputBuildDirectory, 'refMap.json.gz'), refMapGz),
  ]);
  logger.info('Wrote the gzipped error maps from the plain maps.');
}

export default ensureCompressedMaps;
