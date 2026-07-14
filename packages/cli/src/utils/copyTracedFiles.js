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
import { nodeFileTrace } from '@vercel/nft';

const CONCURRENCY = 64;

async function inBatches(items, worker) {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(worker));
  }
}

// Traces the runtime file closure of the server entrypoints with @vercel/nft and reproduces it
// under functionDirectory, preserving relative symlinks. pnpm layouts depend on this: the server's
// node_modules entries are relative symlinks into a .pnpm virtual store (at the workspace root for
// workspace members), and nft's fileList contains both the symlink paths and the real target files,
// all relative to `base` — recreating both yields a working resolution tree inside the function.
async function copyTracedFiles({ base, entrypoints, functionDirectory, logger, processCwd }) {
  const { fileList, warnings } = await nodeFileTrace(entrypoints, { base, processCwd });
  for (const warning of warnings) {
    logger.debug(`nft: ${warning.message}`);
  }

  // Partition by lstat so links are recreated as links, not followed.
  const symlinks = [];
  const files = [];
  const directories = [];
  await inBatches([...fileList], async (file) => {
    let stat;
    try {
      stat = await fs.lstat(path.join(base, file));
    } catch {
      logger.debug(`nft traced a missing file: ${file}`);
      return;
    }
    if (stat.isSymbolicLink()) {
      symlinks.push(file);
    } else if (stat.isDirectory()) {
      directories.push(file);
    } else {
      files.push({ file, mode: stat.mode });
    }
  });

  await inBatches(directories, async (file) => {
    await fs.mkdir(path.join(functionDirectory, file), { recursive: true });
  });

  // Symlinks before files, parents before children: a file whose destination path traverses a
  // symlinked directory must land at the link's target, not turn the link's path into a real
  // directory. Sequential — symlink creation is cheap and ordering matters.
  symlinks.sort((a, b) => a.length - b.length);
  for (const file of symlinks) {
    const source = path.join(base, file);
    const destination = path.join(functionDirectory, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    try {
      await fs.symlink(await fs.readlink(source), destination);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  await inBatches(files, async ({ file, mode }) => {
    const source = path.join(base, file);
    const destination = path.join(functionDirectory, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    await fs.chmod(destination, mode);
  });

  return fileList.size;
}

export default copyTracedFiles;
