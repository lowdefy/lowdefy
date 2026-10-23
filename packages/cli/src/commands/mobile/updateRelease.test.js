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
import { vi, afterEach, beforeEach, describe, expect, test } from 'vitest';

const mockConfig = vi.fn();
const mockRunEas = vi.fn();

vi.doMock('./config.js', () => ({ default: mockConfig }));
vi.doMock('./runEas.js', () => ({ default: mockRunEas }));

const { default: mobileRelease } = await import('./release.js');
const { default: mobileUpdate } = await import('./update.js');

let projectDirectory;

function createContext(options = {}) {
  return {
    logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    options: { env: 'production', platform: 'all', wait: true, ...options },
  };
}

function mockShellProject({ runtimeVersion = '3-field', shellVersion = '6.1.0' } = {}) {
  const shellJson = { id: 'field', profile: 'field', version: '1.4.0', environment: 'production' };
  mockConfig.mockResolvedValue({
    environment: 'production',
    projectDirectory,
    runtimeVersion,
    shell: { id: 'field', version: '1.4' },
    shellJson,
    shellVersion,
  });
  fs.writeFileSync(path.join(projectDirectory, 'shell.json'), JSON.stringify(shellJson));
}

function updateGroup({ group = 'g1', message }) {
  return {
    branch: 'production',
    group,
    message: `"${message}" (2 hours ago by someone)`,
    runtimeVersion: '3-field',
    platforms: 'android, ios',
  };
}

// fixtures: { ios: { build, updates }, android: { build, updates } }, where
// build is the latest finished build or null and updates the newest groups.
function mockEas(fixtures) {
  mockRunEas.mockImplementation(async ({ args, dryRun }) => {
    if (dryRun) {
      return null;
    }
    const platform = args[args.indexOf('--platform') + 1];
    if (args[0] === 'build:list') {
      const build = fixtures[platform]?.build;
      return build ? [build] : [];
    }
    if (args[0] === 'update:list') {
      const updates = fixtures[platform]?.updates ?? [];
      return { name: 'production', id: 'b1', currentPage: updates };
    }
    return null;
  });
}

function easCalls() {
  return mockRunEas.mock.calls.map(([{ args }]) => args);
}

function writeCalls() {
  return easCalls().filter((args) => !args[0].endsWith(':list'));
}

function infoLines(context) {
  return context.logger.info.mock.calls.map(([line]) => line);
}

function readShellJson() {
  return JSON.parse(fs.readFileSync(path.join(projectDirectory, 'shell.json'), 'utf8'));
}

const MESSAGE_6_0 = 'lowdefy-shell@6.0.0 profile=field runtime=3-field';
const MESSAGE_6_1 = 'lowdefy-shell@6.1.0 profile=field runtime=3-field';

beforeEach(() => {
  mockConfig.mockReset();
  mockRunEas.mockReset();
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mobile-release-'));
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

describe('lowdefy mobile update', () => {
  test('publishes to the channel with the shell version, profile and runtime in the message', async () => {
    mockShellProject();
    mockEas({});
    await mobileUpdate({ context: createContext() });
    expect(easCalls()).toEqual([
      [
        'update',
        '--channel',
        'production',
        '--platform',
        'all',
        '--message',
        MESSAGE_6_1,
        '--non-interactive',
      ],
    ]);
  });

  test('--rollout 10 passes the rollout percentage', async () => {
    mockShellProject();
    mockEas({});
    await mobileUpdate({ context: createContext({ rollout: '10', platform: 'android' }) });
    expect(easCalls()[0]).toEqual([
      'update',
      '--channel',
      'production',
      '--platform',
      'android',
      '--message',
      MESSAGE_6_1,
      '--non-interactive',
      '--rollout-percentage',
      '10',
    ]);
  });

  test('--rollout outside 1 to 100 fails before running anything', async () => {
    mockShellProject();
    await expect(mobileUpdate({ context: createContext({ rollout: '150' }) })).rejects.toThrow(
      '--rollout should be a whole percentage from 1 to 100. Received "150".'
    );
    expect(mockConfig).not.toHaveBeenCalled();
  });

  test('--promote rolls the latest update for this runtime out to every device', async () => {
    mockShellProject();
    mockEas({ all: { updates: [updateGroup({ group: 'latest', message: MESSAGE_6_1 })] } });
    await mobileUpdate({ context: createContext({ promote: true }) });
    expect(easCalls()).toEqual([
      [
        'update:list',
        '--branch',
        'production',
        '--platform',
        'all',
        '--limit',
        '1',
        '--runtime-version',
        '3-field',
        '--json',
        '--non-interactive',
      ],
      ['update:edit', 'latest', '--rollout-percentage', '100', '--non-interactive'],
    ]);
  });

  test('--promote fails when there is no update', async () => {
    mockShellProject();
    mockEas({});
    await expect(mobileUpdate({ context: createContext({ promote: true }) })).rejects.toThrow(
      'No update on production for runtime version 3-field to promote.'
    );
  });

  test('--rollback republishes the update before the latest one', async () => {
    mockShellProject();
    mockEas({
      ios: {
        updates: [
          updateGroup({ group: 'bad', message: MESSAGE_6_1 }),
          updateGroup({ group: 'good', message: MESSAGE_6_0 }),
        ],
      },
    });
    await mobileUpdate({ context: createContext({ rollback: true, platform: 'ios' }) });
    expect(easCalls()[0]).toEqual(
      expect.arrayContaining(['update:list', '--limit', '2', '--runtime-version', '3-field'])
    );
    expect(easCalls()[1]).toEqual([
      'update:republish',
      '--group',
      'good',
      '--platform',
      'ios',
      '--message',
      `${MESSAGE_6_0} rollback`,
      '--non-interactive',
    ]);
  });

  test('--rollback fails when there is no earlier update', async () => {
    mockShellProject();
    mockEas({ all: { updates: [updateGroup({ message: MESSAGE_6_1 })] } });
    await expect(mobileUpdate({ context: createContext({ rollback: true }) })).rejects.toThrow(
      'No earlier update on production for runtime version 3-field to roll back to.'
    );
  });

  test('--promote, --rollback and --rollout cannot be combined', async () => {
    await expect(
      mobileUpdate({ context: createContext({ promote: true, rollout: '10' }) })
    ).rejects.toThrow('--promote and --rollout cannot be used together. Pick one.');
  });

  test('--dry-run prints the update and runs nothing', async () => {
    mockShellProject();
    mockEas({});
    await mobileUpdate({ context: createContext({ dryRun: true }) });
    expect(mockRunEas.mock.calls.map(([{ dryRun }]) => dryRun)).toEqual([true]);
  });
});

describe('lowdefy mobile release', () => {
  test('builds and submits iOS on a new runtime and updates Android on a new shell version', async () => {
    mockShellProject();
    mockEas({
      ios: { build: { appVersion: '1.4.7', runtimeVersion: '2-field' } },
      android: {
        build: { appVersion: '1.4.7', runtimeVersion: '3-field' },
        updates: [updateGroup({ message: MESSAGE_6_0 })],
      },
    });
    const context = createContext();
    await mobileRelease({ context });
    expect(writeCalls()).toEqual([
      ['build', '--platform', 'ios', '--profile', 'production', '--non-interactive'],
      ['submit', '--platform', 'ios', '--profile', 'production', '--latest', '--non-interactive'],
      [
        'update',
        '--channel',
        'production',
        '--platform',
        'android',
        '--message',
        MESSAGE_6_1,
        '--non-interactive',
      ],
    ]);
    expect(easCalls()).toContainEqual([
      'update:list',
      '--branch',
      'production',
      '--platform',
      'android',
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ]);
    expect(easCalls().filter((args) => args[0] === 'update:list')).toHaveLength(1);
    expect(readShellJson().version).toBe('1.4.8');
    expect(infoLines(context)).toEqual(
      expect.arrayContaining([
        'ios: build and submit, as the latest build has runtime version 2-field, the shell now 3-field.',
        'android: update, as the latest update carries shell 6.0.0, the shell is now 6.1.0.',
      ])
    );
  });

  test('does nothing when the runtime and shell version are already out', async () => {
    mockShellProject();
    const current = {
      build: { appVersion: '1.4.7', runtimeVersion: '3-field' },
      updates: [updateGroup({ message: MESSAGE_6_1 })],
    };
    mockEas({ ios: current, android: current });
    const context = createContext();
    await mobileRelease({ context });
    expect(writeCalls()).toEqual([]);
    expect(readShellJson().version).toBe('1.4.0');
    expect(infoLines(context)).toEqual(
      expect.arrayContaining([
        'ios: nothing to do, as runtime version 3-field and shell 6.1.0 are already out.',
        'android: nothing to do, as runtime version 3-field and shell 6.1.0 are already out.',
      ])
    );
  });

  test('builds and submits both stores when the channel has no builds', async () => {
    mockShellProject();
    mockEas({});
    const context = createContext();
    await mobileRelease({ context });
    expect(writeCalls().map((args) => args.slice(0, 3))).toEqual([
      ['build', '--platform', 'ios'],
      ['submit', '--platform', 'ios'],
      ['build', '--platform', 'android'],
      ['submit', '--platform', 'android'],
    ]);
    expect(readShellJson().version).toBe('1.4.0');
    expect(infoLines(context)).toContain(
      'ios: build and submit, as no build on the production channel yet.'
    );
  });

  test.each([
    ['a message without a shell version', [updateGroup({ message: 'hotfix' })]],
    ['no update', []],
  ])('treats %s as changed and updates', async (_, updates) => {
    mockShellProject();
    mockEas({ ios: { build: { appVersion: '1.4.7', runtimeVersion: '3-field' }, updates } });
    await mobileRelease({ context: createContext({ platform: 'ios' }) });
    expect(writeCalls()).toEqual([expect.arrayContaining(['update', '--platform', 'ios'])]);
  });

  test('passes --rollout to the update path', async () => {
    mockShellProject();
    mockEas({ ios: { build: { appVersion: '1.4.7', runtimeVersion: '3-field' } } });
    await mobileRelease({ context: createContext({ platform: 'ios', rollout: '25' }) });
    expect(writeCalls()[0]).toEqual(expect.arrayContaining(['--rollout-percentage', '25']));
  });

  test('--non-interactive --no-wait --auto-submit lets EAS submit the queued build', async () => {
    mockShellProject();
    mockEas({ android: { build: { appVersion: '1.4.7', runtimeVersion: '2-field' } } });
    await mobileRelease({
      context: createContext({
        platform: 'android',
        nonInteractive: true,
        wait: false,
        autoSubmit: true,
      }),
    });
    expect(writeCalls()).toEqual([
      [
        'build',
        '--platform',
        'android',
        '--profile',
        'production',
        '--non-interactive',
        '--no-wait',
        '--auto-submit',
      ],
    ]);
    expect(readShellJson().version).toBe('1.4.8');
  });

  test('--no-wait without --auto-submit fails before running anything', async () => {
    mockShellProject();
    await expect(mobileRelease({ context: createContext({ wait: false }) })).rejects.toThrow(
      'lowdefy mobile release --no-wait needs --auto-submit'
    );
    expect(mockConfig).not.toHaveBeenCalled();
  });

  test('raises the store version only on the build path', async () => {
    mockShellProject();
    mockEas({
      ios: {
        build: { appVersion: '1.4.7', runtimeVersion: '3-field' },
        updates: [updateGroup({ message: MESSAGE_6_0 })],
      },
    });
    await mobileRelease({ context: createContext({ platform: 'ios' }) });
    expect(readShellJson().version).toBe('1.4.0');
  });

  test('--dry-run runs nothing and prints both paths per platform', async () => {
    mockShellProject();
    mockEas({});
    const context = createContext({ dryRun: true });
    await mobileRelease({ context });
    expect(mockRunEas.mock.calls.every(([{ dryRun }]) => dryRun === true)).toBe(true);
    expect(easCalls().map((args) => `${args[0]} ${args[args.indexOf('--platform') + 1]}`)).toEqual([
      'build:list ios',
      'update:list ios',
      'build ios',
      'submit ios',
      'update ios',
      'build:list android',
      'update:list android',
      'build android',
      'submit android',
      'update android',
    ]);
    const lines = infoLines(context);
    expect(lines).toContain(
      '[dry run] ios, when there is no build or its runtime version is not 3-field: build and submit.'
    );
    expect(lines).toContain(
      '[dry run] android, when the build is on 3-field and the latest update is not shell 6.1.0: update.'
    );
    expect(lines).toContain('[dry run] android, otherwise: nothing to do.');
  });

  test('an eas failure fails the release with its message', async () => {
    mockShellProject();
    mockRunEas.mockRejectedValue(new Error('eas build:list failed with exit code 1.'));
    await expect(mobileRelease({ context: createContext() })).rejects.toThrow(
      'eas build:list failed with exit code 1.'
    );
  });
});
