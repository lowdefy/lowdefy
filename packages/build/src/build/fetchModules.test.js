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
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

jest.unstable_mockModule('./fetchGitHubModule.js', () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule('./getGitHubHeaders.js', () => ({
  default: jest.fn(async () => ({ Accept: 'application/vnd.github+json' })),
}));

const mainCommit = '4f0a1c9b2e7d5a3f8c1b6e0d9a4f7c2b5e8d1a30';

let fetchModules;
let fetchGitHubModule;
const originalFetch = global.fetch;

function makeConfigDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-config-'));
}

function readLockfile(configDirectory) {
  const filePath = path.join(configDirectory, 'lowdefy-modules.lock.yaml');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

beforeEach(async () => {
  jest.clearAllMocks();
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ sha: mainCommit }) }));
  const mod = await import('./fetchModules.js');
  fetchModules = mod.default;
  const ghMod = await import('./fetchGitHubModule.js');
  fetchGitHubModule = ghMod.default;
});

afterAll(() => {
  global.fetch = originalFetch;
});

test('fetchModules returns empty object for empty moduleEntries', async () => {
  const result = await fetchModules({
    moduleEntries: [],
    context: { directories: { config: '/app' } },
  });
  expect(result).toEqual({});
});

test('fetchModules resolves file source with existing module.lowdefy.yaml', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.lowdefy.yaml'), 'id: test');

  const result = await fetchModules({
    moduleEntries: [{ id: 'my-module', source: `file:${tmpDir}` }],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    'my-module': {
      packageRoot: tmpDir,
      moduleRoot: tmpDir,
      isLocal: true,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules throws a ConfigError when the module entry id is a reserved key', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.lowdefy.yaml'), 'id: test');

  await expect(
    fetchModules({
      moduleEntries: [{ id: '__proto__', source: `file:${tmpDir}` }],
      context: { directories: { config: '/' } },
    })
  ).rejects.toThrow('Module entry id "__proto__" is a reserved name.');

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules throws for file source when module.lowdefy.yaml does not exist', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));

  await expect(
    fetchModules({
      moduleEntries: [{ id: 'my-module', source: `file:${tmpDir}` }],
      context: { directories: { config: '/' } },
    })
  ).rejects.toThrow(`Module "my-module": module.lowdefy.yaml not found at ${tmpDir}`);

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves github source without path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.lowdefy.yaml'), 'id: test');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  const result = await fetchModules({
    moduleEntries: [{ id: 'notifications', source: 'github:lowdefy/notifications@v1.0.0' }],
    context: { directories: { config: '/app' } },
  });

  expect(result).toEqual({
    notifications: {
      packageRoot: tmpDir,
      moduleRoot: tmpDir,
      isLocal: false,
    },
  });
  expect(fetchGitHubModule).toHaveBeenCalledWith(
    { type: 'github', owner: 'lowdefy', repo: 'notifications', path: null, ref: mainCommit },
    { directories: { config: '/app' } }
  );

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves github source with subdirectory path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  const moduleDir = path.join(tmpDir, 'user-admin');
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'module.lowdefy.yaml'), 'id: test');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  const result = await fetchModules({
    moduleEntries: [{ id: 'users', source: 'github:my-org/modules/user-admin@v1.0.0' }],
    context: { directories: { config: '/app' } },
  });

  expect(result).toEqual({
    users: {
      packageRoot: tmpDir,
      moduleRoot: moduleDir,
      isLocal: false,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules throws for github source when module.lowdefy.yaml not found at path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  await expect(
    fetchModules({
      moduleEntries: [{ id: 'users', source: 'github:my-org/modules/user-admin@v1.0.0' }],
      context: { directories: { config: '/app' } },
    })
  ).rejects.toThrow(
    'Module "users": module.lowdefy.yaml not found at path "user-admin" in my-org/modules@v1.0.0'
  );

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules sets packageRoot to git root for file source inside a git repo', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  const gitDir = path.join(tmpDir, '.git');
  const moduleDir = path.join(tmpDir, 'modules', 'user-admin');
  fs.mkdirSync(gitDir);
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'module.lowdefy.yaml'), 'id: test');

  const result = await fetchModules({
    moduleEntries: [{ id: 'users', source: `file:${moduleDir}` }],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    users: {
      packageRoot: tmpDir,
      moduleRoot: moduleDir,
      isLocal: true,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules falls back to module dir as packageRoot when not in a git repo', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.lowdefy.yaml'), 'id: test');

  const result = await fetchModules({
    moduleEntries: [{ id: 'my-module', source: `file:${tmpDir}` }],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    'my-module': {
      packageRoot: tmpDir,
      moduleRoot: tmpDir,
      isLocal: true,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves multiple entries', async () => {
  const tmpDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir1, 'module.lowdefy.yaml'), 'id: local');

  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir2, 'module.lowdefy.yaml'), 'id: remote');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir2 });

  const result = await fetchModules({
    moduleEntries: [
      { id: 'local-mod', source: `file:${tmpDir1}` },
      { id: 'remote-mod', source: 'github:org/repo@v1.0.0' },
    ],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    'local-mod': {
      packageRoot: tmpDir1,
      moduleRoot: tmpDir1,
      isLocal: true,
    },
    'remote-mod': {
      packageRoot: tmpDir2,
      moduleRoot: tmpDir2,
      isLocal: false,
    },
  });

  fs.rmSync(tmpDir1, { recursive: true });
  fs.rmSync(tmpDir2, { recursive: true });
});

describe('lockfile', () => {
  const otherCommit = '9c3e5b1f7a2d4e8c0b6f3a9d5e1c7b4a2f6d0e83';

  function setupModuleDir() {
    const moduleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-module-'));
    fs.writeFileSync(path.join(moduleDir, 'module.lowdefy.yaml'), 'id: test');
    fetchGitHubModule.mockResolvedValue({ packageRoot: moduleDir });
    return moduleDir;
  }

  test('fetchModules writes a lock entry on a first fetch when the build may write it', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();

    await fetchModules({
      moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@main' }],
      context: {
        directories: { config: configDirectory },
        stage: 'dev',
        writeModuleLock: true,
        handleWarning: jest.fn(),
      },
    });

    expect(readLockfile(configDirectory)).toContain('source: github:acme/team-users@main');
    expect(readLockfile(configDirectory)).toContain(`commit: ${mainCommit}`);
    expect(readLockfile(configDirectory)).toContain('ref: main');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/team-users/commits/main',
      expect.any(Object)
    );

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules fetches the locked commit and makes no GitHub request on a second build', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    const context = {
      directories: { config: configDirectory },
      stage: 'dev',
      writeModuleLock: true,
      handleWarning: jest.fn(),
    };
    const moduleEntries = [{ id: 'team-users', source: 'github:acme/team-users@main' }];

    await fetchModules({ moduleEntries, context });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    fetchGitHubModule.mockClear();
    global.fetch.mockClear();

    await fetchModules({ moduleEntries, context });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(fetchGitHubModule).toHaveBeenCalledWith(
      expect.objectContaining({ ref: mainCommit }),
      context
    );

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules re-resolves when the locked source does not match the entry source', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    fs.writeFileSync(
      path.join(configDirectory, 'lowdefy-modules.lock.yaml'),
      [
        'team-users:',
        '  source: github:other-org/team-users@main',
        '  ref: main',
        `  commit: ${otherCommit}`,
        '  fetchedAt: 2026-08-14T11:02:05.774Z',
        '',
      ].join('\n')
    );

    await fetchModules({
      moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@main' }],
      context: {
        directories: { config: configDirectory },
        stage: 'dev',
        writeModuleLock: true,
        handleWarning: jest.fn(),
      },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(readLockfile(configDirectory)).toContain(`commit: ${mainCommit}`);
    expect(readLockfile(configDirectory)).toContain('source: github:acme/team-users@main');

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules does not write the lockfile when the build may not write it', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();

    await fetchModules({
      moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@v1.0.0' }],
      context: {
        directories: { config: configDirectory },
        stage: 'prod',
        writeModuleLock: false,
        handleWarning: jest.fn(),
      },
    });

    expect(readLockfile(configDirectory)).toBeNull();

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules fails a production build for a branch ref with no lock entry, before calling GitHub', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();

    await expect(
      fetchModules({
        moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@main' }],
        context: {
          directories: { config: configDirectory },
          stage: 'prod',
          writeModuleLock: false,
          handleWarning: jest.fn(),
        },
      })
    ).rejects.toThrow(
      'Module "team-users" resolves branch ref "main" with no entry in lowdefy-modules.lock.yaml.'
    );

    // Nothing was resolved or fetched against a module the build cannot pin.
    expect(global.fetch).not.toHaveBeenCalled();

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules rejects a lock entry whose commit is not a 40 character sha', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    fs.writeFileSync(
      path.join(configDirectory, 'lowdefy-modules.lock.yaml'),
      [
        'team-users:',
        '  source: github:acme/team-users@main',
        '  ref: main',
        '  commit: main',
        '',
      ].join('\n')
    );

    await expect(
      fetchModules({
        moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@main' }],
        context: {
          directories: { config: configDirectory },
          stage: 'dev',
          writeModuleLock: true,
          handleWarning: jest.fn(),
        },
      })
    ).rejects.toThrow(/whose commit is not a 40 character sha. Received "main"/);

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules raises no warning for an immutable ref with no lock entry', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    const handleWarning = jest.fn();

    await fetchModules({
      moduleEntries: [{ id: 'billing', source: 'github:acme/billing@v2.1.0' }],
      context: {
        directories: { config: configDirectory },
        stage: 'prod',
        writeModuleLock: false,
        handleWarning,
      },
    });

    expect(handleWarning).not.toHaveBeenCalled();

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules raises no warning for a branch ref when the lockfile is written', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    const handleWarning = jest.fn();

    await fetchModules({
      moduleEntries: [{ id: 'team-users', source: 'github:acme/team-users@main' }],
      context: {
        directories: { config: configDirectory },
        stage: 'dev',
        writeModuleLock: true,
        handleWarning,
      },
    });

    expect(handleWarning).not.toHaveBeenCalled();

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules never locks file sources', async () => {
    const configDirectory = makeConfigDir();
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-local-'));
    fs.writeFileSync(path.join(localDir, 'module.lowdefy.yaml'), 'id: local');
    const moduleDir = setupModuleDir();

    await fetchModules({
      moduleEntries: [
        { id: 'local-mod', source: `file:${localDir}` },
        { id: 'billing', source: 'github:acme/billing@v2.1.0' },
      ],
      context: {
        directories: { config: configDirectory },
        stage: 'dev',
        writeModuleLock: true,
        handleWarning: jest.fn(),
      },
    });

    const content = readLockfile(configDirectory);
    expect(content).toContain('billing:');
    expect(content).not.toContain('local-mod');

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(localDir, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });

  test('fetchModules drops lock entries for modules no longer in the app config', async () => {
    const configDirectory = makeConfigDir();
    const moduleDir = setupModuleDir();
    fs.writeFileSync(
      path.join(configDirectory, 'lowdefy-modules.lock.yaml'),
      [
        'removed:',
        '  source: github:acme/removed@main',
        '  ref: main',
        `  commit: ${otherCommit}`,
        '  fetchedAt: 2026-08-14T11:02:05.774Z',
        'billing:',
        '  source: github:acme/billing@v2.1.0',
        '  ref: v2.1.0',
        `  commit: ${otherCommit}`,
        '  fetchedAt: 2026-08-14T11:02:05.774Z',
        '',
      ].join('\n')
    );

    await fetchModules({
      moduleEntries: [{ id: 'billing', source: 'github:acme/billing@v2.1.0' }],
      context: {
        directories: { config: configDirectory },
        stage: 'dev',
        writeModuleLock: true,
        handleWarning: jest.fn(),
      },
    });

    const content = readLockfile(configDirectory);
    expect(content).toContain('billing:');
    expect(content).not.toContain('removed:');
    expect(global.fetch).not.toHaveBeenCalled();

    fs.rmSync(configDirectory, { recursive: true });
    fs.rmSync(moduleDir, { recursive: true });
  });
});
