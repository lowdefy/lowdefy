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

/*
  Keeps only the turbo cache entries the latest `turbo run --summarize` used, so the
  cache CI saves holds one build of the monorepo instead of every build since the
  lockfile last changed.

  Usage: node scripts/ci-prune-turbo-cache.mjs (after `turbo run build --summarize`)
*/

import fs from 'node:fs';
import path from 'node:path';

const cacheDirectory = path.resolve('.turbo/cache');
const runsDirectory = path.resolve('.turbo/runs');

const latestRun = fs
  .readdirSync(runsDirectory)
  .map((name) => path.join(runsDirectory, name))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const usedHashes = new Set(
  JSON.parse(fs.readFileSync(latestRun, 'utf8')).tasks.map((task) => task.hash)
);

let removed = 0;
fs.readdirSync(cacheDirectory).forEach((name) => {
  const hash = name.split(/[-.]/)[0];
  if (!usedHashes.has(hash)) {
    fs.rmSync(path.join(cacheDirectory, name));
    removed += 1;
  }
});
console.log(
  `Kept the cache entries of ${usedHashes.size} tasks, removed ${removed} files of older builds.`
);
