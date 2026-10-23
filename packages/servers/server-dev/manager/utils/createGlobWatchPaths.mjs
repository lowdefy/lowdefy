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
import path from 'path';

import picomatch from 'picomatch';

function toUnixPath(filePath) {
  const normalized = path.normalize(filePath);
  return path.sep === '\\' ? normalized.replace(/\\/g, '/') : normalized;
}

function isUnder({ filePath, root }) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

function isDirectory({ filePath, stats }) {
  if (stats) {
    return stats.isDirectory();
  }
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

// chokidar 4 watches paths only, where chokidar 3 also took globs, which `lowdefy dev --watch`
// documents. A glob is watched from the directory it starts at (picomatch's scan base), and the
// returned ignore function drops the files under that directory the glob does not match.
// Directories are never dropped, so chokidar still walks into those that can hold a match.
// Paths are compared with forward slashes, as chokidar 3 compared them.
function createGlobWatchPaths(watchPaths) {
  const roots = [];
  const globs = [];
  for (const watchPath of watchPaths) {
    const scan = picomatch.scan(toUnixPath(watchPath));
    if (!scan.isGlob) {
      roots.push(watchPath);
      continue;
    }
    const base = path.normalize(scan.base === '' ? '.' : scan.base);
    globs.push({ base, isMatch: picomatch(toUnixPath(watchPath), { dot: true }) });
    roots.push(base);
  }
  if (globs.length === 0) {
    return { watchPaths: roots, ignore: null };
  }
  const plainRoots = roots.filter((root) => !globs.some(({ base }) => base === root));
  function isOutsideGlobs(filePath, stats) {
    if (plainRoots.some((root) => isUnder({ filePath, root }))) return false;
    const underGlobs = globs.filter(({ base }) => isUnder({ filePath, root: base }));
    if (underGlobs.length === 0) return false;
    if (isDirectory({ filePath, stats })) return false;
    const unixPath = toUnixPath(filePath);
    return !underGlobs.some(({ isMatch }) => isMatch(unixPath));
  }
  return { watchPaths: [...new Set(roots)], ignore: isOutsideGlobs };
}

export default createGlobWatchPaths;
