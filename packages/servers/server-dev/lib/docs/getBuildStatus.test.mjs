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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

const mockClientErrors = jest.fn();
jest.unstable_mockModule('./clientErrorStore.js', () => ({ default: { list: mockClientErrors } }));
const mockServerErrors = jest.fn();
jest.unstable_mockModule('./serverErrorStore.js', () => ({ default: { list: mockServerErrors } }));
jest.unstable_mockModule('./getBuildId.js', () => ({ default: () => 'build-2' }));
const mockGetPageBuildStatus = jest.fn(() => ({ unbuilt: 0 }));
jest.unstable_mockModule('./getPageBuildStatus.js', () => ({ default: mockGetPageBuildStatus }));
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: () => ({ status: 'ok', errors: [], warnings: ['a build warning'] }),
}));

const { default: getBuildStatus } = await import('./getBuildStatus.js');

test('getBuildStatus lists errors from earlier builds apart from the current ones', async () => {
  mockClientErrors.mockReturnValue([
    { message: 'old render error', buildId: 'build-1' },
    { message: 'live render error', buildId: 'build-2' },
  ]);
  mockServerErrors.mockReturnValue([{ message: 'old request error', buildId: 'build-1' }]);

  const status = await getBuildStatus();

  expect(status.clientErrors).toEqual([{ message: 'live render error', buildId: 'build-2' }]);
  expect(status.serverErrors).toEqual([]);
  expect(status.earlierErrors).toEqual({
    note: expect.stringContaining('may already be fixed'),
    clientErrors: [{ message: 'old render error', buildId: 'build-1' }],
    serverErrors: [{ message: 'old request error', buildId: 'build-1' }],
  });
});

test('getBuildStatus leaves out earlierErrors when every error is current', async () => {
  mockClientErrors.mockReturnValue([{ message: 'live', buildId: 'build-2' }]);
  mockServerErrors.mockReturnValue([]);

  expect((await getBuildStatus()).earlierErrors).toBeUndefined();
});

test('getBuildStatus passes the pages build status just built to the page status', async () => {
  mockClientErrors.mockReturnValue([]);
  mockServerErrors.mockReturnValue([]);

  const status = await getBuildStatus({ checked: ['home'] });

  expect(mockGetPageBuildStatus).toHaveBeenCalledWith({ checked: ['home'] });
  expect(status.pages).toEqual({ unbuilt: 0 });
  expect(status.build.status).toBe('ok');
});

test('getBuildStatus names the build being served as a top-level buildId', async () => {
  mockClientErrors.mockReturnValue([]);
  mockServerErrors.mockReturnValue([]);

  expect((await getBuildStatus()).buildId).toBe('build-2');
});

describe('agentFiles', () => {
  let root;
  let previousConfigDirectory;

  beforeEach(() => {
    mockClientErrors.mockReturnValue([]);
    mockServerErrors.mockReturnValue([]);
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-build-status-'));
    fs.mkdirSync(path.join(root, '.git'));
    fs.writeFileSync(path.join(root, 'lowdefy.yaml'), 'lowdefy: 7.1.0\n');
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), '@AGENTS.md\n');
    previousConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
    process.env.LOWDEFY_DIRECTORY_CONFIG = root;
  });

  afterEach(() => {
    if (previousConfigDirectory === undefined) {
      delete process.env.LOWDEFY_DIRECTORY_CONFIG;
    } else {
      process.env.LOWDEFY_DIRECTORY_CONFIG = previousConfigDirectory;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  const writeBlock = (version) =>
    fs.writeFileSync(
      path.join(root, 'AGENTS.md'),
      `<!-- BEGIN:lowdefy-agent-rules version=${version} -->\n<!-- END:lowdefy-agent-rules -->\n`
    );

  test('lists notices apart from the build warnings, and a fix shows on the next call', async () => {
    writeBlock('7.0.0');

    const before = await getBuildStatus();
    expect(before.agentFiles).toEqual([
      {
        code: 'version_mismatch',
        message: expect.stringContaining('npx lowdefy@7.1.0 agent-setup'),
      },
    ]);
    expect(before.build.warnings).toEqual(['a build warning']);

    writeBlock('7.1.2');

    const after = await getBuildStatus();
    expect(after).not.toHaveProperty('agentFiles');
    expect(after.build.warnings).toEqual(['a build warning']);
  });

  test('leaves agentFiles out when lowdefy.yaml cannot be read', async () => {
    writeBlock('6.0.0');
    fs.rmSync(path.join(root, 'lowdefy.yaml'));

    expect(await getBuildStatus()).not.toHaveProperty('agentFiles');
  });
});
