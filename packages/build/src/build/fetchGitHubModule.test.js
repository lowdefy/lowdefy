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
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { create } from 'tar';

const mockFetchGitModuleOverSsh = jest.fn();
jest.unstable_mockModule('./fetchGitModuleOverSsh.js', () => ({
  default: mockFetchGitModuleOverSsh,
}));

const { default: fetchGitHubModule, isImmutableRef } = await import('./fetchGitHubModule.js');

describe('fetchGitHubModule', () => {
  const source = { owner: 'acme', repo: 'private-modules', path: 'modules/cx', ref: 'abc1234' };
  const env = { ...process.env };
  let configDir;
  let context;
  let repoParent;
  let repoCache;

  beforeEach(() => {
    configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-fetch-test-'));
    context = { directories: { config: configDir } };
    repoParent = path.join(configDir, '.lowdefy', 'modules', 'github', 'acme', 'private-modules');
    repoCache = path.join(repoParent, 'abc1234');
    process.env.GITHUB_TOKEN = 'test-token';
    delete process.env.GITHUB_SSH_KEY;
    mockFetchGitModuleOverSsh.mockReset();
    jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    process.env = { ...env };
    fs.rmSync(configDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  function mockApiResponse({ status, statusText, body = statusText }) {
    const response = new Response(body, { status, statusText });
    global.fetch.mockResolvedValue(response);
    return response;
  }

  function mockSshFetchWritesModule() {
    mockFetchGitModuleOverSsh.mockImplementation(async ({ destDir }) => {
      fs.writeFileSync(path.join(destDir, 'module.lowdefy.yaml'), 'name: cx\n');
    });
  }

  async function createTarball({ files }) {
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-tarball-src-'));
    try {
      Object.entries(files).forEach(([name, content]) => {
        const filePath = path.join(srcDir, 'acme-private-modules-abc1234', name);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      });
      const chunks = [];
      for await (const chunk of create({ gzip: true, cwd: srcDir }, [
        'acme-private-modules-abc1234',
      ])) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } finally {
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
  }

  function partialDirs() {
    return fs.readdirSync(repoParent).filter((name) => name.includes('.partial-'));
  }

  test('fetchGitHubModule extracts the API tarball into the cache', async () => {
    const tarball = await createTarball({ files: { 'module.lowdefy.yaml': 'name: cx\n' } });
    mockApiResponse({ status: 200, statusText: 'OK', body: tarball });

    const result = await fetchGitHubModule(source, context);

    expect(result).toEqual({ packageRoot: repoCache });
    expect(fs.readFileSync(path.join(repoCache, 'module.lowdefy.yaml'), 'utf8')).toBe('name: cx\n');
    expect(partialDirs()).toEqual([]);
    expect(mockFetchGitModuleOverSsh).not.toHaveBeenCalled();
  });

  test('fetchGitHubModule leaves no cache when the API tarball fails to extract', async () => {
    mockApiResponse({ status: 200, statusText: 'OK', body: Buffer.from('not a tarball') });

    await expect(fetchGitHubModule(source, context)).rejects.toThrow();
    expect(fs.existsSync(repoCache)).toBe(false);
    expect(partialDirs()).toEqual([]);
  });

  test('fetchGitHubModule replaces the cache of a mutable ref', async () => {
    const branchSource = { ...source, ref: 'main' };
    const branchCache = path.join(repoParent, 'main');
    fs.mkdirSync(branchCache, { recursive: true });
    fs.writeFileSync(path.join(branchCache, 'stale.yaml'), '');
    const tarball = await createTarball({ files: { 'module.lowdefy.yaml': 'name: cx\n' } });
    mockApiResponse({ status: 200, statusText: 'OK', body: tarball });

    await fetchGitHubModule(branchSource, context);

    expect(fs.readdirSync(branchCache)).toEqual(['module.lowdefy.yaml']);
  });

  test.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
  ])(
    'fetchGitHubModule fetches over SSH when the API returns %i and GITHUB_SSH_KEY is set',
    async (status, statusText) => {
      process.env.GITHUB_SSH_KEY = 'private-key';
      const response = mockApiResponse({ status, statusText });
      const cancel = jest.spyOn(response.body, 'cancel');
      mockSshFetchWritesModule();

      const result = await fetchGitHubModule(source, context);

      expect(result).toEqual({ packageRoot: repoCache });
      expect(cancel).toHaveBeenCalled();
      expect(mockFetchGitModuleOverSsh).toHaveBeenCalledWith({
        remoteUrl: 'git@github.com:acme/private-modules.git',
        ref: 'abc1234',
        destDir: expect.stringContaining(`${repoCache}.partial-`),
        sshKey: 'private-key',
      });
      expect(fs.readFileSync(path.join(repoCache, 'module.lowdefy.yaml'), 'utf8')).toBe(
        'name: cx\n'
      );
      expect(partialDirs()).toEqual([]);
    }
  );

  test('fetchGitHubModule throws the API error when the API returns 404 and GITHUB_SSH_KEY is not set', async () => {
    mockApiResponse({ status: 404, statusText: 'Not Found' });

    await expect(fetchGitHubModule(source, context)).rejects.toThrow(
      'Failed to fetch module from https://api.github.com/repos/acme/private-modules/tarball/abc1234: 404 Not Found'
    );
    expect(mockFetchGitModuleOverSsh).not.toHaveBeenCalled();
  });

  test('fetchGitHubModule throws the API error when GITHUB_SSH_KEY is only whitespace', async () => {
    process.env.GITHUB_SSH_KEY = ' \n ';
    mockApiResponse({ status: 404, statusText: 'Not Found' });

    await expect(fetchGitHubModule(source, context)).rejects.toThrow('404 Not Found');
    expect(mockFetchGitModuleOverSsh).not.toHaveBeenCalled();
  });

  test('fetchGitHubModule does not fetch over SSH when the API fails with a server error', async () => {
    process.env.GITHUB_SSH_KEY = 'private-key';
    mockApiResponse({ status: 500, statusText: 'Internal Server Error' });

    await expect(fetchGitHubModule(source, context)).rejects.toThrow('500 Internal Server Error');
    expect(mockFetchGitModuleOverSsh).not.toHaveBeenCalled();
  });

  test('fetchGitHubModule reports both failures and leaves no cache when the SSH fetch fails', async () => {
    process.env.GITHUB_SSH_KEY = 'private-key';
    mockApiResponse({ status: 404, statusText: 'Not Found' });
    mockFetchGitModuleOverSsh.mockImplementation(async ({ destDir }) => {
      fs.writeFileSync(path.join(destDir, 'partial.yaml'), '');
      throw new Error('Permission denied (publickey).');
    });

    await expect(fetchGitHubModule(source, context)).rejects.toThrow(
      '404 Not Found. Fetching over SSH with GITHUB_SSH_KEY also failed: Permission denied (publickey).'
    );
    expect(fs.existsSync(repoCache)).toBe(false);
    expect(partialDirs()).toEqual([]);
  });

  test('fetchGitHubModule returns the cache without fetching for an immutable ref', async () => {
    fs.mkdirSync(repoCache, { recursive: true });

    const result = await fetchGitHubModule(source, context);

    expect(result).toEqual({ packageRoot: repoCache });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('isImmutableRef', () => {
  test('returns true for full commit SHA', () => {
    expect(isImmutableRef('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')).toBe(true);
  });

  test('returns true for abbreviated commit SHA (7 chars)', () => {
    expect(isImmutableRef('a1b2c3d')).toBe(true);
  });

  test('returns true for semver tag v1.0.0', () => {
    expect(isImmutableRef('v1.0.0')).toBe(true);
  });

  test('returns true for semver tag without v prefix', () => {
    expect(isImmutableRef('1.0.0')).toBe(true);
  });

  test('returns true for major-only tag v1', () => {
    expect(isImmutableRef('v1')).toBe(true);
  });

  test('returns true for major.minor tag v1.2', () => {
    expect(isImmutableRef('v1.2')).toBe(true);
  });

  test('returns true for prerelease tag v1.0.0-beta.1', () => {
    expect(isImmutableRef('v1.0.0-beta.1')).toBe(true);
  });

  test('returns false for branch name main', () => {
    expect(isImmutableRef('main')).toBe(false);
  });

  test('returns false for branch name develop', () => {
    expect(isImmutableRef('develop')).toBe(false);
  });

  test('returns false for branch name feature/my-feature', () => {
    expect(isImmutableRef('feature/my-feature')).toBe(false);
  });

  test('returns false for branch name with numbers like release-2', () => {
    // Contains non-hex chars so not a SHA, and no dots so not a semver pattern
    expect(isImmutableRef('release-2')).toBe(false);
  });

  test('returns false for short hex string below 7 chars', () => {
    expect(isImmutableRef('a1b2c3')).toBe(false);
  });
});
