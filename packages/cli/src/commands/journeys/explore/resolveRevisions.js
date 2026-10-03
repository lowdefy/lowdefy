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

import { type } from '@lowdefy/helpers';

import readPullRequest from './readPullRequest.js';
import runGit from './runGit.js';

async function hasCommit({ sha, cwd }) {
  try {
    await runGit({ args: ['cat-file', '-e', `${sha}^{commit}`], cwd });
    return true;
  } catch {
    return false;
  }
}

async function fromPullRequest({ number, cwd, head }) {
  const pullRequest = await readPullRequest({ number, cwd });
  if (head !== pullRequest.headRefOid) {
    throw new Error(
      `This checkout is at ${head}; PR #${pullRequest.number}'s head is ${pullRequest.headRefOid}. Run from the PR's worktree (the journeys-from-pr skill makes one), or pass --against.`
    );
  }
  if (!(await hasCommit({ sha: pullRequest.baseRefOid, cwd }))) {
    await runGit({ args: ['fetch', 'origin', pullRequest.baseRefName], cwd });
  }
  const base = await runGit({
    args: ['merge-base', pullRequest.baseRefOid, pullRequest.headRefOid],
    cwd,
  });
  return {
    base,
    pr: { number: pullRequest.number, url: pullRequest.url, title: pullRequest.title },
    context: { title: pullRequest.title ?? null, body: pullRequest.body ?? '' },
  };
}

async function fromRef({ against, cwd }) {
  const base = await runGit({ args: ['merge-base', against, 'HEAD'], cwd });
  const messages = await runGit({ args: ['log', '--format=%s%n%n%b', `${base}..HEAD`], cwd });
  return { base, pr: null, context: { title: null, body: messages.trim() } };
}

// The two revisions the explorer compares. The head is the working tree of
// this checkout, uncommitted changes included (dirty). The base is the merge
// base with the PR's base branch (--pr) or with a ref (--against), and the
// context is the text a policy reads about the change: the PR's title and
// body, or the commit messages since the base.
async function resolveRevisions({ pr, against, cwd }) {
  if (type.isNone(pr) === type.isNone(against)) {
    throw new Error('Pass one of --pr <number> or --against <ref>.');
  }
  const root = await runGit({ args: ['rev-parse', '--show-toplevel'], cwd });
  const head = await runGit({ args: ['rev-parse', 'HEAD'], cwd });
  const status = await runGit({ args: ['status', '--porcelain'], cwd: root });
  const resolved = type.isNone(pr)
    ? await fromRef({ against, cwd })
    : await fromPullRequest({ number: pr, cwd, head });
  return { root, head, dirty: status !== '', ...resolved };
}

export default resolveRevisions;
