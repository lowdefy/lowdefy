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
import zlib from 'node:zlib';

import compareFileBytes from './compareFileBytes.mjs';
import compareText from './compareText.mjs';
import createPathReplacer from './createPathReplacer.mjs';
import extractBuildMessages from './extractBuildMessages.mjs';

const SERVER_PLACEHOLDER = '<server>';
// Not a file: the warnings and errors the build logged, compared like one.
const BUILD_MESSAGES = 'build messages';

function listFiles({ directory, prefix }) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .join(prefix, path.relative(directory, path.join(entry.parentPath, entry.name)))
        .split(path.sep)
        .join('/')
    );
}

// The files compared, relative to the server directory: everything the build
// wrote to build/, and the server's package.json.
function listServerFiles({ serverDirectory }) {
  return [
    ...listFiles({ directory: path.join(serverDirectory, 'build'), prefix: 'build' }),
    'package.json',
  ];
}

function createSide({ output, serverDirectory }) {
  return {
    output,
    replacePath: createPathReplacer({
      directory: serverDirectory,
      placeholder: SERVER_PLACEHOLDER,
    }),
    serverDirectory,
  };
}

// A file only the current build has, which --expect-added allows. A gzip file
// must hold exactly the plain file beside it.
function checkAddedFile({ current, file }) {
  if (!file.endsWith('.gz')) {
    return { file, identical: true, lines: [] };
  }
  const plainFile = file.slice(0, -'.gz'.length);
  const plainPath = path.join(current.serverDirectory, plainFile);
  if (!fs.existsSync(plainPath)) {
    return { file, identical: false, lines: [`${plainFile} is missing beside it.`] };
  }
  const unzipped = zlib.gunzipSync(fs.readFileSync(path.join(current.serverDirectory, file)));
  if (unzipped.equals(fs.readFileSync(plainPath))) {
    return { file, identical: true, lines: [] };
  }
  return { file, identical: false, lines: [`Does not gunzip to ${plainFile}.`] };
}

// Compares two builds file by file: { serverDirectory, output } per side,
// output being the CLI's build log. comparers maps a server-relative file
// (build/keyMap.json) to a comparer used in place of the byte comparison,
// called as compare({ file, baseline, current }) with each side's
// { serverDirectory, replacePath } and resolving to { identical, lines }.
// expectAdded lists build-relative files allowed in the current build only.
// Resolves to { identical, onlyBaseline, onlyCurrent, added, differences,
// compared }, differences and added being [{ file, identical, lines }].
async function compareBuilds({ baseline, current, comparers = {}, expectAdded = [] }) {
  const sides = {
    baseline: createSide(baseline),
    current: createSide(current),
  };
  const baselineFiles = new Set(listServerFiles(sides.baseline));
  const currentFiles = new Set(listServerFiles(sides.current));
  const expectedAdded = new Set(expectAdded.map((file) => `build/${file}`));

  const onlyBaseline = [...baselineFiles].filter((file) => !currentFiles.has(file)).sort();
  const onlyCurrentAll = [...currentFiles].filter((file) => !baselineFiles.has(file)).sort();
  const onlyCurrent = onlyCurrentAll.filter((file) => !expectedAdded.has(file));
  const added = [...expectedAdded].sort().map((file) => {
    if (baselineFiles.has(file)) {
      return { file, identical: true, lines: [] };
    }
    if (!currentFiles.has(file)) {
      return { file, identical: false, lines: ['Expected in the current build, but missing.'] };
    }
    return checkAddedFile({ current: sides.current, file });
  });

  const shared = [...baselineFiles].filter((file) => currentFiles.has(file)).sort();
  const differences = [];
  for (const file of shared) {
    const compare = comparers[file] ?? compareFileBytes;
    const result = await compare({ file, baseline: sides.baseline, current: sides.current });
    if (!result.identical) {
      differences.push({ file, ...result });
    }
  }

  const messages = compareText({
    file: BUILD_MESSAGES,
    baseline: extractBuildMessages(sides.baseline).join('\n'),
    current: extractBuildMessages(sides.current).join('\n'),
  });
  if (!messages.identical) {
    differences.push({ file: BUILD_MESSAGES, ...messages });
  }

  return {
    identical:
      onlyBaseline.length === 0 &&
      onlyCurrent.length === 0 &&
      differences.length === 0 &&
      added.every((result) => result.identical),
    added,
    compared: shared.length,
    differences,
    onlyBaseline,
    onlyCurrent,
  };
}

export { BUILD_MESSAGES };
export default compareBuilds;
