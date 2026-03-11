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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { promisify } from 'node:util';

import { Unpack } from 'tar';
import { ConfigError } from '@lowdefy/errors';

const execFileAsync = promisify(execFile);

function isImmutableRef(ref) {
  // Full or abbreviated commit SHAs
  if (/^[0-9a-f]{7,40}$/.test(ref)) return true;
  // Semver-like tags: v1.0.0, v1, 1.2.3, v1.0.0-beta.1, etc.
  if (/^v?\d+(\.\d+)*(-[\w.]+)?$/.test(ref)) return true;
  return false;
}

async function getGhToken() {
  try {
    const { stdout } = await execFileAsync('gh', ['auth', 'token']);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

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
  const headers = { Accept: 'application/vnd.github+json' };

  // Auth: GITHUB_TOKEN env var, then gh CLI token
  const token = process.env.GITHUB_TOKEN || (await getGhToken());
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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
