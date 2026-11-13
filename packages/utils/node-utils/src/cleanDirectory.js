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

import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

// Empties the directory in place, as fs-extra's emptyDir did, rather than removing and
// recreating it: the dev server's watchers watch the build directory itself, and a watch on a
// removed directory is not guaranteed to follow its replacement. Keeping the directory also
// keeps its mode and owner. Creates the directory when it is missing.
async function cleanDirectory(dirPath) {
  await mkdir(dirPath, { recursive: true });
  const entries = await readdir(dirPath);
  await Promise.all(
    entries.map((entry) => rm(path.join(dirPath, entry), { recursive: true, force: true }))
  );
}

export default cleanDirectory;
