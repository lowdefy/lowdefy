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

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import checkMockUserWarning from './checkMockUserWarning.mjs';

async function testContext(authJson) {
  const directory = await mkdtemp(path.join(tmpdir(), 'lowdefy-mock-user-'));
  if (authJson) {
    await writeFile(path.join(directory, 'auth.json'), JSON.stringify(authJson));
  }
  return { directories: { build: directory }, logger: { warn: jest.fn() } };
}

afterEach(() => {
  delete process.env.LOWDEFY_DEV_USER;
});

test('checkMockUserWarning warns when auth.dev.browserUser names the browser caller', async () => {
  const context = await testContext({
    configured: false,
    dev: { browserUser: 'admin', users: { admin: { id: 'dev-admin' } } },
  });

  await checkMockUserWarning(context)();

  expect(context.logger.warn).toHaveBeenCalledWith('Mock user active - login bypassed');
});

test('checkMockUserWarning warns for the deprecated auth.dev.mockUser', async () => {
  const context = await testContext({ configured: true, dev: { mockUser: { id: 'dev' } } });

  await checkMockUserWarning(context)();

  expect(context.logger.warn).toHaveBeenCalledWith('Mock user active - login bypassed');
});

test('checkMockUserWarning warns when LOWDEFY_DEV_USER is set', async () => {
  const context = await testContext();
  process.env.LOWDEFY_DEV_USER = '{"id":"env-user"}';

  await checkMockUserWarning(context)();

  expect(context.logger.warn).toHaveBeenCalledWith('Mock user active - login bypassed');
});

test('checkMockUserWarning stays silent when no dev browser caller is declared', async () => {
  const context = await testContext({ configured: false, dev: { users: { admin: {} } } });

  await checkMockUserWarning(context)();

  expect(context.logger.warn).not.toHaveBeenCalled();
});
