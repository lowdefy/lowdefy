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

import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { jest } from '@jest/globals';

const mockSpawn = jest.fn();
jest.unstable_mockModule('node:child_process', () => ({ spawn: mockSpawn }));

const { default: runEas } = await import('./runEas.js');
const { default: EAS_CLI_VERSION } = await import('./easCliVersion.js');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function createContext() {
  return { logger: { info: jest.fn(), debug: jest.fn() } };
}

function mockChild({ code = 0, stdout = '' } = {}) {
  mockSpawn.mockImplementation(() => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    setImmediate(() => {
      child.stdout.write(stdout);
      child.stdout.end();
      child.emit('close', code);
    });
    return child;
  });
}

const savedEnv = { ...process.env };

beforeEach(() => {
  mockSpawn.mockReset();
  process.env.EXPO_TOKEN = 'secret-expo-token';
  delete process.env.SENTRY_AUTH_TOKEN;
});

afterAll(() => {
  process.env = savedEnv;
});

test('runEas with dryRun prints the npx command, cwd and the variables it sets, and runs nothing', async () => {
  const context = createContext();
  const result = await runEas({
    context,
    args: ['build', '--platform', 'all', '--profile', 'staging'],
    projectDirectory: '/app/.lowdefy/mobile/field/project',
    dryRun: true,
  });
  expect(result).toBe(null);
  expect(mockSpawn).not.toHaveBeenCalled();
  const lines = context.logger.info.mock.calls.map(([line]) => line);
  expect(lines).toEqual([
    `[dry run] ${npx} --yes eas-cli@${EAS_CLI_VERSION} build --platform all --profile staging`,
    '[dry run]   cwd: /app/.lowdefy/mobile/field/project',
    '[dry run]   env: EAS_NO_VCS=1 EAS_PROJECT_ROOT=/app/.lowdefy/mobile/field/project',
    '[dry run]   passed through: EXPO_TOKEN',
  ]);
  expect(lines.join('\n')).not.toContain('secret-expo-token');
});

test('runEas spawns npx eas-cli at the pinned version in the project with EAS_NO_VCS', async () => {
  mockChild();
  const result = await runEas({
    context: createContext(),
    args: ['build', '--platform', 'ios', '--profile', 'production'],
    projectDirectory: '/project',
  });
  expect(result).toBe(null);
  expect(mockSpawn).toHaveBeenCalledTimes(1);
  const [command, args, options] = mockSpawn.mock.calls[0];
  expect(command).toBe(npx);
  expect(args).toEqual([
    '--yes',
    `eas-cli@${EAS_CLI_VERSION}`,
    'build',
    '--platform',
    'ios',
    '--profile',
    'production',
  ]);
  expect(options.cwd).toBe('/project');
  expect(options.env.EAS_NO_VCS).toBe('1');
  expect(options.env.EAS_PROJECT_ROOT).toBe('/project');
  expect(options.env.EXPO_TOKEN).toBe('secret-expo-token');
  expect(options.stdio).toEqual(['inherit', 'inherit', 'inherit']);
});

test('runEas pins a version, not a range', () => {
  expect(EAS_CLI_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
});

test('runEas with --json returns the parsed output', async () => {
  mockChild({ stdout: '[{"appVersion":"1.4.7","runtimeVersion":"3-field"}]' });
  const result = await runEas({
    context: createContext(),
    args: ['build:list', '--json', '--non-interactive'],
    projectDirectory: '/project',
  });
  expect(result).toEqual([{ appVersion: '1.4.7', runtimeVersion: '3-field' }]);
  expect(mockSpawn.mock.calls[0][2].stdio).toEqual(['inherit', 'pipe', 'inherit']);
});

test('runEas with --json fails when eas prints something else', async () => {
  mockChild({ stdout: 'Not logged in' });
  await expect(
    runEas({ context: createContext(), args: ['build:list', '--json'], projectDirectory: '/p' })
  ).rejects.toThrow('eas build:list did not print JSON. Received: Not logged in');
});

test('runEas fails when eas exits non-zero', async () => {
  mockChild({ code: 1 });
  await expect(
    runEas({ context: createContext(), args: ['submit', '--latest'], projectDirectory: '/p' })
  ).rejects.toThrow('eas submit --latest failed with exit code 1.');
});
