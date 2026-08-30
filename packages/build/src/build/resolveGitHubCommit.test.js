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

jest.unstable_mockModule('./getGitHubHeaders.js', () => ({
  default: jest.fn(async () => ({ Accept: 'application/vnd.github+json' })),
}));

let resolveGitHubCommit;
let getGitHubHeaders;
const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  resolveGitHubCommit = (await import('./resolveGitHubCommit.js')).default;
  getGitHubHeaders = (await import('./getGitHubHeaders.js')).default;
});

afterAll(() => {
  global.fetch = originalFetch;
});

test('resolveGitHubCommit returns the commit sha for a ref', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ sha: '4f0a1c9b2e7d5a3f8c1b6e0d9a4f7c2b5e8d1a30' }),
  });

  const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer token' };
  await expect(
    resolveGitHubCommit({ owner: 'acme', repo: 'modules', ref: 'main', headers })
  ).resolves.toBe('4f0a1c9b2e7d5a3f8c1b6e0d9a4f7c2b5e8d1a30');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.github.com/repos/acme/modules/commits/main',
    { headers, redirect: 'follow' }
  );
  expect(getGitHubHeaders).not.toHaveBeenCalled();
});

test('resolveGitHubCommit builds headers when none are given', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ sha: 'abc1234' }) });

  await expect(resolveGitHubCommit({ owner: 'acme', repo: 'modules', ref: 'main' })).resolves.toBe(
    'abc1234'
  );
  expect(getGitHubHeaders).toHaveBeenCalled();
});

test('resolveGitHubCommit throws a ConfigError naming the ref and status', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

  await expect(
    resolveGitHubCommit({ owner: 'acme', repo: 'modules', ref: 'no-such-branch', headers: {} })
  ).rejects.toThrow(
    'Failed to resolve ref "no-such-branch" of acme/modules to a commit: 404 Not Found.'
  );
});

test('resolveGitHubCommit throws a ConfigError when the response has no sha', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

  await expect(
    resolveGitHubCommit({ owner: 'acme', repo: 'modules', ref: 'main', headers: {} })
  ).rejects.toThrow('response did not include a commit sha');
});
