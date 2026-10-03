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

import { jest } from '@jest/globals';

const mockExecFile = jest.fn();
jest.unstable_mockModule('child_process', () => ({ execFile: mockExecFile }));

const { default: readPullRequest } = await import('./readPullRequest.js');

// promisify(execFile) resolves with the callback's second argument.
function execFileResolves(stdout) {
  mockExecFile.mockImplementation((command, args, options, callback) =>
    callback(null, { stdout, stderr: '' })
  );
}

function execFileFails(error) {
  mockExecFile.mockImplementation((command, args, options, callback) => callback(error));
}

beforeEach(() => {
  mockExecFile.mockReset();
});

test('readPullRequest reads the PR refs and text from gh pr view', async () => {
  const pullRequest = {
    number: 2531,
    title: 'Tickets page',
    body: 'Adds a page.',
    url: 'https://github.com/acme/app/pull/2531',
    baseRefName: 'main',
    baseRefOid: 'a'.repeat(40),
    headRefName: 'feature',
    headRefOid: 'b'.repeat(40),
  };
  execFileResolves(JSON.stringify({ ...pullRequest, extra: 'ignored' }));

  expect(await readPullRequest({ number: 2531, cwd: '/repo' })).toEqual(pullRequest);
  const [command, args, options] = mockExecFile.mock.calls[0];
  expect(command).toEqual('gh');
  expect(args).toEqual([
    'pr',
    'view',
    '2531',
    '--json',
    'number,title,body,url,baseRefName,baseRefOid,headRefName,headRefOid',
  ]);
  expect(options.cwd).toEqual('/repo');
});

test('readPullRequest without gh on the path names --against', async () => {
  execFileFails(Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' }));
  await expect(readPullRequest({ number: 2531, cwd: '/repo' })).rejects.toThrow(
    '--pr needs the GitHub CLI (gh) on the path. Install it, or pass --against <ref> to explore the changes since a branch or commit.'
  );
});

test('readPullRequest passes on what gh says when it fails', async () => {
  execFileFails(
    Object.assign(new Error('Command failed'), {
      code: 1,
      stderr: 'no pull requests found for 99\n',
    })
  );
  await expect(readPullRequest({ number: 99, cwd: '/repo' })).rejects.toThrow(
    'gh pr view 99 failed: no pull requests found for 99'
  );
});
