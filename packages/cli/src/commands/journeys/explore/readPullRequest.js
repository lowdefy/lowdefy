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

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const FIELDS = [
  'number',
  'title',
  'body',
  'url',
  'baseRefName',
  'baseRefOid',
  'headRefName',
  'headRefOid',
];

// The pull request's refs and text, through the GitHub CLI.
async function readPullRequest({ number, cwd }) {
  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      'gh',
      ['pr', 'view', String(number), '--json', FIELDS.join(',')],
      {
        cwd,
        maxBuffer: 16 * 1024 * 1024,
      }
    ));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        '--pr needs the GitHub CLI (gh) on the path. Install it, or pass --against <ref> to explore the changes since a branch or commit.'
      );
    }
    const message = (error.stderr ?? '').trim() || error.message;
    throw new Error(`gh pr view ${number} failed: ${message}`, { cause: error });
  }
  const pullRequest = JSON.parse(stdout);
  return Object.fromEntries(FIELDS.map((field) => [field, pullRequest[field] ?? null]));
}

export default readPullRequest;
