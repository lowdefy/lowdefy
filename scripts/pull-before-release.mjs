#!/usr/bin/env node
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
  Bring the checkout up to date with its remote branch before an experimental release.

  An experimental is built from whatever the checkout holds, so a checkout that was not
  pulled publishes old code under a new version. This step:
    - refuses to run with uncommitted changes, since the release ends with
      `git checkout -- .`, which would discard them;
    - refuses a branch with no upstream, or with local commits the upstream lacks;
    - fetches and fast-forwards to the upstream;
    - prints the branch and commit the release is built from.
*/

import { execFileSync } from 'node:child_process';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function getUpstream() {
  try {
    return git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  } catch {
    return null;
  }
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch === 'HEAD') {
  fail('The checkout is on a detached HEAD. Check out the branch to release from first.');
}

const changes = git(['status', '--porcelain']);
if (changes !== '') {
  fail(
    `The checkout has uncommitted changes, and the release ends by discarding changes with \`git checkout -- .\`. Commit or move them first:\n${changes}`
  );
}

const upstream = getUpstream();
if (upstream === null) {
  fail(
    `Branch "${branch}" has no upstream to pull from. Set one with \`git branch -u origin/${branch}\`.`
  );
}

const [remote] = upstream.split('/');
console.log(`Fetching ${remote}...`);
git(['fetch', remote]);

const ahead = git(['rev-list', '--count', `${upstream}..HEAD`]);
if (ahead !== '0') {
  fail(
    `Branch "${branch}" has ${ahead} commit(s) that ${upstream} does not. Push or drop them, so the release is built from what is on ${upstream}.`
  );
}

const behind = git(['rev-list', '--count', `HEAD..${upstream}`]);
if (behind !== '0') {
  console.log(`Fast-forwarding ${branch} by ${behind} commit(s) to ${upstream}...`);
  git(['merge', '--ff-only', upstream]);
}

const commit = git(['log', '-1', '--format=%h %s']);
console.log(`Releasing from ${branch} at ${commit}.`);
