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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

const mockConfig = jest.fn();
const mockRunEas = jest.fn();

jest.unstable_mockModule('./config.js', () => ({ default: mockConfig }));
jest.unstable_mockModule('./runEas.js', () => ({ default: mockRunEas }));

const { default: mobileBuild } = await import('./build.js');
const { default: mobileSubmit } = await import('./submit.js');

let projectDirectory;

function createContext(options = {}) {
  return {
    logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
    options: { env: 'production', platform: 'all', ...options },
  };
}

function mockShellProject({ environment = 'production', version = '1.4' } = {}) {
  const shellJson = { id: 'field', profile: 'field', version: `${version}.0`, environment };
  mockConfig.mockResolvedValue({
    environment,
    projectDirectory,
    runtimeVersion: '3-field',
    shell: { id: 'field', version },
    shellJson,
    shellVersion: '7.1.0',
  });
  fs.writeFileSync(path.join(projectDirectory, 'shell.json'), JSON.stringify(shellJson));
}

// Each build:list call answers with the platform's fixture; other eas calls
// return null as non-JSON commands do.
function mockLatestBuilds(byPlatform) {
  mockRunEas.mockImplementation(async ({ args }) => {
    if (args[0] === 'build:list') {
      const platform = args[args.indexOf('--platform') + 1];
      const appVersion = byPlatform[platform];
      return appVersion ? [{ appVersion, runtimeVersion: '3-field' }] : [];
    }
    return null;
  });
}

function easCalls() {
  return mockRunEas.mock.calls.map(([{ args }]) => args);
}

function readShellJson() {
  return JSON.parse(fs.readFileSync(path.join(projectDirectory, 'shell.json'), 'utf8'));
}

beforeEach(() => {
  mockConfig.mockReset();
  mockRunEas.mockReset();
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mobile-build-'));
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

test('build reads the latest finished build per platform on the channel', async () => {
  mockShellProject({ environment: 'staging' });
  mockLatestBuilds({});
  await mobileBuild({ context: createContext({ env: 'staging' }) });
  expect(easCalls().slice(0, 2)).toEqual(
    ['ios', 'android'].map((platform) => [
      'build:list',
      '--platform',
      platform,
      '--channel',
      'staging',
      '--status',
      'finished',
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ])
  );
  expect(mockRunEas.mock.calls[0][0].projectDirectory).toBe(projectDirectory);
});

test.each([
  ['1.4', { ios: '1.4.7', android: '1.4.7' }, '1.4.8'],
  ['1.5', { ios: '1.4.7', android: '1.4.7' }, '1.5.0'],
  ['1.4', {}, '1.4.0'],
  ['1.4', { ios: '1.4.7', android: '1.4.9' }, '1.4.10'],
])(
  'build with entry version %s and latest builds %j writes store version %s',
  async (version, latest, expected) => {
    mockShellProject({ version });
    mockLatestBuilds(latest);
    await mobileBuild({ context: createContext() });
    expect(readShellJson().version).toBe(expected);
    expect(readShellJson().profile).toBe('field');
  }
);

test('build --platform ios reads and builds iOS only', async () => {
  mockShellProject();
  mockLatestBuilds({ ios: '1.4.2', android: '1.4.9' });
  await mobileBuild({ context: createContext({ platform: 'ios' }) });
  expect(readShellJson().version).toBe('1.4.3');
  expect(easCalls()).toEqual([
    expect.arrayContaining(['build:list', 'ios']),
    ['build', '--platform', 'ios', '--profile', 'production'],
  ]);
});

test('build --env staging --non-interactive queues the build without waiting', async () => {
  mockShellProject({ environment: 'staging' });
  mockLatestBuilds({});
  await mobileBuild({ context: createContext({ env: 'staging', nonInteractive: true }) });
  expect(easCalls().at(-1)).toEqual([
    'build',
    '--platform',
    'all',
    '--profile',
    'staging',
    '--non-interactive',
    '--no-wait',
  ]);
});

test('build is interactive by default', async () => {
  mockShellProject({ environment: 'staging' });
  mockLatestBuilds({});
  await mobileBuild({ context: createContext({ env: 'staging' }) });
  expect(easCalls().at(-1)).toEqual(['build', '--platform', 'all', '--profile', 'staging']);
});

test('build --local passes through to eas build and waits', async () => {
  mockShellProject();
  mockLatestBuilds({});
  await mobileBuild({
    context: createContext({ local: true, nonInteractive: true, platform: 'android' }),
  });
  expect(easCalls().at(-1)).toEqual([
    'build',
    '--platform',
    'android',
    '--profile',
    'production',
    '--non-interactive',
    '--local',
  ]);
});

test('build --profile development builds the development profile without a store version', async () => {
  mockShellProject();
  mockLatestBuilds({ ios: '1.4.7' });
  await mobileBuild({ context: createContext({ profile: 'development' }) });
  expect(easCalls()).toEqual([['build', '--platform', 'all', '--profile', 'development']]);
  expect(readShellJson().version).toBe('1.4.0');
});

test('build fails before building when the shell has no store version', async () => {
  mockShellProject({ version: null });
  mockLatestBuilds({});
  await expect(mobileBuild({ context: createContext() })).rejects.toThrow(
    'Shell "field" has no "version". A store build needs one as "major.minor"'
  );
  expect(easCalls().map((args) => args[0])).not.toContain('build');
});

test('build --dry-run prints build:list and build in order and runs none', async () => {
  mockShellProject();
  mockRunEas.mockResolvedValue(null);
  const context = createContext({ dryRun: true, env: 'production' });
  await mobileBuild({ context });
  expect(mockRunEas.mock.calls.map(([{ args, dryRun }]) => [args[0], args[2], dryRun])).toEqual([
    ['build:list', 'ios', true],
    ['build:list', 'android', true],
    ['build', 'all', true],
  ]);
  expect(readShellJson().version).toBe('1.4.0');
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('[dry run] shell.json version: 1.4.<patch>')
  );
});

test('an eas failure fails the build with its message', async () => {
  mockShellProject();
  mockRunEas.mockImplementation(async ({ args }) => {
    if (args[0] === 'build') {
      throw new Error('eas build --platform all --profile production failed with exit code 1.');
    }
    return [];
  });
  await expect(mobileBuild({ context: createContext() })).rejects.toThrow(
    'eas build --platform all --profile production failed with exit code 1.'
  );
});

test('submit --env production --platform ios uploads the latest build', async () => {
  mockShellProject();
  mockRunEas.mockResolvedValue(null);
  const context = createContext({ platform: 'ios' });
  await mobileSubmit({ context });
  expect(easCalls()).toEqual([
    ['submit', '--platform', 'ios', '--profile', 'production', '--latest'],
  ]);
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('see lowdefy mobile checklist')
  );
});

test('submit --non-interactive passes it on', async () => {
  mockShellProject({ environment: 'staging' });
  mockRunEas.mockResolvedValue(null);
  await mobileSubmit({ context: createContext({ env: 'staging', nonInteractive: true }) });
  expect(easCalls()).toEqual([
    ['submit', '--platform', 'all', '--profile', 'staging', '--latest', '--non-interactive'],
  ]);
});

test('submit --dry-run runs nothing', async () => {
  mockShellProject();
  mockRunEas.mockResolvedValue(null);
  await mobileSubmit({ context: createContext({ dryRun: true }) });
  expect(mockRunEas.mock.calls[0][0].dryRun).toBe(true);
});
