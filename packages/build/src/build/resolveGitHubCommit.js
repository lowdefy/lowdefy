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

import { ConfigError } from '@lowdefy/errors';

import getGitHubHeaders from './getGitHubHeaders.js';

async function resolveGitHubCommit({ owner, repo, ref, headers }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${ref}`;
  const requestHeaders = headers ?? (await getGitHubHeaders());

  const response = await fetch(url, { headers: requestHeaders, redirect: 'follow' });
  if (!response.ok) {
    throw new ConfigError(
      `Failed to resolve ref "${ref}" of ${owner}/${repo} to a commit: ${response.status} ${response.statusText}.`
    );
  }

  const body = await response.json();
  if (!body?.sha) {
    throw new ConfigError(
      `Failed to resolve ref "${ref}" of ${owner}/${repo} to a commit: response did not include a commit sha.`
    );
  }
  return body.sha;
}

export default resolveGitHubCommit;
