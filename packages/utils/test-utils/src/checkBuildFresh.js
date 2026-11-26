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

import buildCommand from './buildCommand.js';
import listBuildConfigFiles from './listBuildConfigFiles.js';

function getModifiedTime(filePath) {
  // A path the build read that is not a file here (a ref resolver's own path, a file since
  // deleted) can not be compared.
  return fs.statSync(filePath, { throwIfNoEntry: false })?.mtimeMs ?? null;
}

// Tests on a build older than the config would pass on old code, so a config file edited after
// the build is refused.
//
// This check is best effort. It sees only the config files refMap.json lists and the root
// lowdefy.yaml, compared by modified time. It does not see a changed plugin, a changed
// environment value the build read (_build.env), or anything a ref resolver reads, and the
// build's inputs can not all be listed. A build made in the same run, as CI does, is never stale.
function checkBuildFresh({ directories, refMap }) {
  const builtAt = getModifiedTime(path.join(directories.build, 'refMap.json'));
  const newer = listBuildConfigFiles({ directories, refMap }).filter((filePath) => {
    const modifiedAt = getModifiedTime(filePath);
    return modifiedAt !== null && modifiedAt > builtAt;
  });
  if (newer.length === 0) {
    return;
  }
  const others = newer.length === 1 ? '' : ` and ${newer.length - 1} more`;
  throw new Error(
    `The Lowdefy build at "${directories.build}" is older than config file "${path.relative(
      directories.config,
      newer[0]
    )}"${others}. Run "${buildCommand}" in the app's directory, then run the tests again. This check is best effort: it compares only the config files the build listed, and does not see a changed plugin, environment value or ref resolver input.`
  );
}

export default checkBuildFresh;
