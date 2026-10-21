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

import path from 'path';

import picomatch from 'picomatch';

function toUnixPath(filePath) {
  const normalized = path.normalize(filePath);
  return path.sep === '\\' ? normalized.replace(/\\/g, '/') : normalized;
}

// chokidar 4 matches a string in `ignored` only as an exact path, where chokidar 3 read it as a
// glob, and a plain path as that path and everything under it. This compiles the string ignores
// into one function that matches them as chokidar 3 did, so '**/node_modules/**' and the app's
// watchIgnore globs still apply. Paths and patterns are compared with forward slashes, as
// chokidar 3 compared them.
function createGlobIgnore(patterns) {
  const matchers = patterns.map((pattern) => {
    const unixPattern = toUnixPath(pattern);
    if (picomatch.scan(unixPattern).isGlob) {
      return picomatch(unixPattern, { dot: true });
    }
    return (unixPath) => unixPath === unixPattern || unixPath.startsWith(`${unixPattern}/`);
  });
  return function isGlobIgnored(filePath) {
    const unixPath = toUnixPath(filePath);
    return matchers.some((matches) => matches(unixPath));
  };
}

export default createGlobIgnore;
