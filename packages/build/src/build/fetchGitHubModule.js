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
import { promisify } from 'node:util';

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import extractTarball from './extractTarball.js';
import fetchGitModuleOverSsh from './fetchGitModuleOverSsh.js';

const execFileAsync = promisify(execFile);

// The API answers 404 for a private repository the caller cannot read, and 401 or 403 when the
// token it was sent is invalid or not authorised for the repository's organisation.
const SSH_FALLBACK_STATUSES = [401, 403, 404];

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
  const apiError = `Failed to fetch module from ${url}: ${response.status} ${response.statusText}`;

  // A GITHUB_SSH_KEY (such as a read-only deploy key) reaches a private repository over git when
  // the API refuses it. Public repositories stay on the API, since a deploy key can read only the
  // repository it belongs to.
  const sshKey = process.env.GITHUB_SSH_KEY;
  const useSsh =
    SSH_FALLBACK_STATUSES.includes(response.status) && !type.isNone(sshKey) && sshKey.trim() !== '';
  if (!response.ok && !useSsh) {
    throw new ConfigError(apiError);
  }

  // Extract next to the cache and rename into place once complete, so an interrupted fetch never
  // leaves a partial directory that the immutable-ref cache check would serve on later builds.
  fs.mkdirSync(path.dirname(repoCache), { recursive: true });
  const stagingDir = fs.mkdtempSync(`${repoCache}.partial-`);
  try {
    if (useSsh) {
      // Release the connection held by the unread error response.
      await response.body.cancel();
      try {
        await fetchGitModuleOverSsh({
          remoteUrl: `git@github.com:${source.owner}/${source.repo}.git`,
          ref: source.ref,
          destDir: stagingDir,
          sshKey,
        });
      } catch (error) {
        throw new ConfigError(
          `${apiError}. Fetching over SSH with GITHUB_SSH_KEY also failed: ${error.message}`,
          { cause: error }
        );
      }
    } else {
      await extractTarball({ body: response.body, destDir: stagingDir });
    }
    fs.rmSync(repoCache, { recursive: true, force: true });
    fs.renameSync(stagingDir, repoCache);
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  return { packageRoot: repoCache };
}

export default fetchGitHubModule;
export { isImmutableRef, getGhToken };
