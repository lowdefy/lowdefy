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

jest.unstable_mockModule('fs', () => ({
  default: { readFileSync: jest.fn() },
}));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFile: jest.fn(),
}));
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/resetServerPackageJson.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/addCustomPluginsAsDeps.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/ensurePnpmWorkspaceYaml.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/installServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/runLowdefyCheck.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('./createAgainstWorktrees.js', () => ({ default: jest.fn() }));

const { default: fs } = await import('fs');
const { readFile } = await import('@lowdefy/node-utils');
const { default: getServer } = await import('../../utils/getServer.js');
const { default: installServer } = await import('../../utils/installServer.js');
const { default: runLowdefyCheck } = await import('../../utils/runLowdefyCheck.js');
const { default: createAgainstWorktrees } = await import('./createAgainstWorktrees.js');
const { default: check } = await import('./check.js');

const errorEntry = {
  message: 'Block type "Buton" not found.',
  name: 'ConfigError',
  source: '/app/pages/home.yaml:7',
  config: 'root.pages[0:home:Box].blocks[0:b:Buton]',
  configKey: 'a1',
  checkSlug: null,
  prodError: false,
};

function createContext({ against, json, plugins } = {}) {
  return {
    directories: { config: '/app', server: '/app/.lowdefy/server' },
    logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    lowdefyVersion: '5.0.0',
    options: { against, json, logLevel: 'info' },
    plugins: plugins ?? {},
    pnpmCmd: 'pnpm',
    sendTelemetry: jest.fn(),
  };
}

// The server directory records what it has installed in package.json, against
// the pristine package.original.json the server package ships.
function mockServerDirectory({ dependencies = {}, version = '5.0.0', missing = false } = {}) {
  fs.readFileSync.mockImplementation((filePath) => {
    if (missing) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    if (filePath === '/app/.lowdefy/server/package.original.json') {
      return JSON.stringify({ dependencies: { '@lowdefy/api': '5.0.0' } });
    }
    if (filePath === '/app/.lowdefy/server/package.json') {
      return JSON.stringify({
        version,
        dependencies: { '@lowdefy/api': '5.0.0', ...dependencies },
      });
    }
    throw new Error(`Unexpected read of ${filePath}.`);
  });
}

let stdout;
let writeSpy;

beforeEach(() => {
  stdout = '';
  writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += chunk;
    return true;
  });
  process.exitCode = undefined;
  // clearMocks clears calls but keeps implementations, and these two are given
  // per-test implementations that must not leak into the next test.
  runLowdefyCheck.mockReset();
  createAgainstWorktrees.mockReset();
  mockServerDirectory();
});

afterEach(() => {
  writeSpy.mockRestore();
  process.exitCode = undefined;
});

test('check exits 0 and prints No problems found for a clean report', async () => {
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  const context = createContext();
  const report = await check({ context });
  expect(report).toEqual({ errors: [], warnings: [] });
  expect(runLowdefyCheck).toHaveBeenCalledWith({ context, directory: '/app/.lowdefy/server' });
  expect(readFile).toHaveBeenCalledWith('/app/.lowdefy/server/build/checkReport.json');
  expect(stdout).toBe('No problems found.\n');
  expect(process.exitCode).toBeUndefined();
  expect(getServer).not.toHaveBeenCalled();
});

test('check sets exit code 1 and prints the grouped report when there are errors', async () => {
  readFile.mockResolvedValue(JSON.stringify({ errors: [errorEntry], warnings: [] }));
  await check({ context: createContext() });
  expect(stdout).toBe(
    [
      'pages/home.yaml',
      '     7  ConfigError: Block type "Buton" not found.',
      '',
      '1 error, 0 warnings',
      '',
    ].join('\n')
  );
  expect(process.exitCode).toBe(1);
});

test('check does not fail on warnings alone', async () => {
  readFile.mockResolvedValue(
    JSON.stringify({ errors: [], warnings: [{ ...errorEntry, name: 'ConfigWarning' }] })
  );
  await check({ context: createContext() });
  expect(stdout).toContain('0 errors, 1 warning');
  expect(process.exitCode).toBeUndefined();
});

test('check --json prints only the report object', async () => {
  const report = { errors: [errorEntry], warnings: [] };
  readFile.mockResolvedValue(JSON.stringify(report));
  await check({ context: createContext({ json: true }) });
  expect(JSON.parse(stdout)).toEqual(report);
  expect(stdout.trim().split('\n')).toHaveLength(1);
  expect(process.exitCode).toBe(1);
});

test('check prepares the server directory when its package.json is missing', async () => {
  mockServerDirectory({ missing: true });
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  const context = createContext();
  await check({ context });
  expect(getServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server',
    directory: '/app/.lowdefy/server',
  });
  expect(installServer).toHaveBeenCalledTimes(1);
  expect(runLowdefyCheck).toHaveBeenCalledTimes(1);
});

test('check re-prepares the server directory when a plugin dependency was added', async () => {
  mockServerDirectory();
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  await check({
    context: createContext({ plugins: { blocks: { name: 'my-blocks', version: '1.0.0' } } }),
  });
  expect(installServer).toHaveBeenCalledTimes(1);
});

test('check re-prepares the server directory when a plugin version changed', async () => {
  mockServerDirectory({ dependencies: { 'my-blocks': '1.0.0' } });
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  await check({
    context: createContext({ plugins: { blocks: { name: 'my-blocks', version: '2.0.0' } } }),
  });
  expect(installServer).toHaveBeenCalledTimes(1);
});

test('check re-prepares the server directory when the Lowdefy version changed', async () => {
  mockServerDirectory({ version: '4.0.0' });
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  await check({ context: createContext() });
  expect(installServer).toHaveBeenCalledTimes(1);
});

test('check reuses the server directory when the installed plugin set still matches', async () => {
  mockServerDirectory({ dependencies: { 'my-blocks': '1.0.0' } });
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  await check({
    context: createContext({ plugins: { blocks: { name: 'my-blocks', version: '1.0.0' } } }),
  });
  expect(installServer).not.toHaveBeenCalled();
});

test('check throws when the child wrote no report', async () => {
  readFile.mockResolvedValue(null);
  await expect(check({ context: createContext() })).rejects.toThrow(
    'Lowdefy check did not write a report to /app/.lowdefy/server/build/checkReport.json.'
  );
});

const collisionEntry = {
  message:
    'Page id "orders" is added on this branch and on "develop". Merging them would declare it twice.',
  name: 'ConfigError',
  source: '/app/pages/orders.yaml',
  config: null,
  configKey: null,
  checkSlug: 'branch-merge',
  prodError: false,
};

function mockWorktrees() {
  const remove = jest.fn();
  createAgainstWorktrees.mockResolvedValue({
    againstDirectory: '/tmp/wt/against/app',
    baseDirectory: '/tmp/wt/base/app',
    remove,
  });
  return remove;
}

test('check --against names the worktrees for the child, prints the merge section and removes them', async () => {
  const remove = mockWorktrees();
  readFile.mockResolvedValue(
    JSON.stringify({
      errors: [],
      warnings: [],
      against: { ref: 'develop', errors: [collisionEntry], warnings: [] },
    })
  );
  runLowdefyCheck.mockImplementation(async () => {
    expect(process.env.LOWDEFY_CHECK_AGAINST_REF).toBe('develop');
    expect(process.env.LOWDEFY_CHECK_AGAINST_CONFIG).toBe('/tmp/wt/against/app');
    expect(process.env.LOWDEFY_CHECK_BASE_CONFIG).toBe('/tmp/wt/base/app');
  });

  await check({ context: createContext({ against: 'develop' }) });

  expect(createAgainstWorktrees).toHaveBeenCalledWith({ configDirectory: '/app', ref: 'develop' });
  expect(stdout).toBe(
    [
      'Merge against develop',
      '',
      'pages/orders.yaml',
      '        ConfigError: Page id "orders" is added on this branch and on "develop". Merging them would declare it twice. (branch-merge)',
      '',
      '1 error, 0 warnings',
      '',
    ].join('\n')
  );
  expect(process.exitCode).toBe(1);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(process.env.LOWDEFY_CHECK_AGAINST_REF).toBeUndefined();
});

test('check --against removes the worktrees when the check fails', async () => {
  const remove = mockWorktrees();
  runLowdefyCheck.mockRejectedValue(new Error('Lowdefy check failed to run.'));

  await expect(check({ context: createContext({ against: 'develop' }) })).rejects.toThrow(
    'Lowdefy check failed to run.'
  );

  expect(remove).toHaveBeenCalledTimes(1);
  expect(process.env.LOWDEFY_CHECK_AGAINST_CONFIG).toBeUndefined();
});

test('check without --against creates no worktree', async () => {
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  await check({ context: createContext() });
  expect(createAgainstWorktrees).not.toHaveBeenCalled();
  expect(process.env.LOWDEFY_CHECK_AGAINST_REF).toBeUndefined();
});
