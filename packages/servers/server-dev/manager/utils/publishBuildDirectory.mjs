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

import fs from 'fs/promises';
import path from 'path';

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)));
}

// The dev server reads build artifacts from disk on every request. Emptying
// the build directory and writing the new build into it leaves a window where
// artifacts are missing, so the build is written to a staging directory and
// moved over the live one file by file. A rename replaces a file in one step,
// so a reader always finds each artifact, from the old build or the new one.
// Live files the new build did not write are removed next. The page registry
// is moved last: the JIT page builder rebuilds its cached build context, and
// drops its built pages, when the registry changes, so the registry must
// arrive after every other new file and after the old build's pages are gone.
// The live directory itself is never replaced, so file watchers on it keep
// working.
const pageRegistryFile = 'pageRegistry.json';

async function moveFile({ buildDirectory, stagingDirectory, file }) {
  const target = path.join(buildDirectory, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rename(path.join(stagingDirectory, file), target);
}

async function publishBuildDirectory({ buildDirectory, stagingDirectory }) {
  await fs.mkdir(buildDirectory, { recursive: true });
  const stagedFiles = await listFiles(stagingDirectory);
  const liveFiles = await listFiles(buildDirectory);

  for (const file of stagedFiles.filter((stagedFile) => stagedFile !== pageRegistryFile)) {
    await moveFile({ buildDirectory, stagingDirectory, file });
  }

  const staged = new Set(stagedFiles);
  const staleFiles = liveFiles.filter((file) => !staged.has(file));
  await Promise.all(
    staleFiles.map((file) => fs.rm(path.join(buildDirectory, file), { force: true }))
  );

  await moveFile({ buildDirectory, stagingDirectory, file: pageRegistryFile });
  await fs.rm(stagingDirectory, { recursive: true, force: true });
}

export default publishBuildDirectory;
