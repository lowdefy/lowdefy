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
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { Unpack } from 'tar';
import { ConfigError } from '@lowdefy/errors';

import getGitHubHeaders, { getGhToken } from './getGitHubHeaders.js';
import isImmutableRef from './isImmutableRef.js';

async function extractTarball(body, destDir) {
  // Ensure destination exists and is clean
  fs.mkdirSync(destDir, { recursive: true });

  // GitHub tarballs have a top-level directory like {owner}-{repo}-{sha}/
  // We strip it so contents extract directly into destDir
  await pipeline(
    body,
    createGunzip(),
    new Unpack({
      cwd: destDir,
      strip: 1,
    })
  );
}

async function fetchGitHubModule(source, context) {
  const cacheDir = path.join(context.directories.config, '.lowdefy', 'modules', 'github');
  const repoCache = path.join(cacheDir, source.owner, source.repo, source.ref);

  // Check cache — only skip fetch for refs we're confident are immutable
  if (fs.existsSync(repoCache) && isImmutableRef(source.ref)) {
    return { packageRoot: repoCache };
  }

  // Fetch tarball from GitHub API
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/tarball/${source.ref}`;
  const headers = await getGitHubHeaders();

  const response = await fetch(url, { headers, redirect: 'follow' });
  if (!response.ok) {
    throw new ConfigError(
      `Failed to fetch module from ${url}: ${response.status} ${response.statusText}`
    );
  }

  // Clean existing cache for mutable refs before extracting
  if (fs.existsSync(repoCache)) {
    fs.rmSync(repoCache, { recursive: true, force: true });
  }

  // Extract tarball to cache
  await extractTarball(response.body, repoCache);

  return { packageRoot: repoCache };
}

export default fetchGitHubModule;
export { isImmutableRef, getGhToken, extractTarball };
