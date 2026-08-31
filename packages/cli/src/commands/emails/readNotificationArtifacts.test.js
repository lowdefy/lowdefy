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
import path from 'path';

jest.unstable_mockModule('fs', () => {
  const promises = {
    readdir: jest.fn(),
    readFile: jest.fn(),
  };
  return { default: { existsSync: jest.fn(), promises }, existsSync: jest.fn(), promises };
});

const context = {
  directories: {
    build: '/test/.lowdefy/server/build',
  },
};

const buildFiles = {
  '/test/.lowdefy/server/build/app.json': { email: { companyName: 'MyApp' } },
  '/test/.lowdefy/server/build/types.json': {
    notifications: { NotificationEmail: { package: '@lowdefy/email-templates' } },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('readNotificationArtifacts reads flat and nested notification artifacts', async () => {
  const fs = (await import('fs')).default;
  const { default: readNotificationArtifacts } = await import('./readNotificationArtifacts.js');

  fs.existsSync.mockReturnValue(true);
  fs.promises.readdir.mockResolvedValue([
    'welcome.json',
    'invites/invite-user.json',
    'invites/notes.txt',
    'invites',
  ]);
  const notificationsDirectory = '/test/.lowdefy/server/build/notifications';
  const artifacts = {
    [path.join(notificationsDirectory, 'welcome.json')]: { notificationId: 'welcome' },
    [path.join(notificationsDirectory, 'invites/invite-user.json')]: {
      notificationId: 'invites/invite-user',
    },
  };
  fs.promises.readFile.mockImplementation(async (filePath) =>
    JSON.stringify(artifacts[filePath] ?? buildFiles[filePath])
  );

  const result = await readNotificationArtifacts({ context });

  expect(fs.promises.readdir).toHaveBeenCalledWith(notificationsDirectory, { recursive: true });
  expect(result.notifications).toEqual([
    { notificationId: 'welcome' },
    { notificationId: 'invites/invite-user' },
  ]);
  expect(result.appEmail).toEqual({ companyName: 'MyApp' });
  expect(result.notificationTypes).toEqual({
    NotificationEmail: { package: '@lowdefy/email-templates' },
  });
});

test('readNotificationArtifacts returns empty notifications when directory is missing', async () => {
  const fs = (await import('fs')).default;
  const { default: readNotificationArtifacts } = await import('./readNotificationArtifacts.js');

  fs.existsSync.mockReturnValue(false);
  fs.promises.readFile.mockImplementation(async (filePath) =>
    JSON.stringify(buildFiles[filePath])
  );

  const result = await readNotificationArtifacts({ context });

  expect(fs.promises.readdir).not.toHaveBeenCalled();
  expect(result.notifications).toEqual([]);
  expect(result.appEmail).toEqual({ companyName: 'MyApp' });
});
