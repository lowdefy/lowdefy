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

jest.unstable_mockModule('fs', () => {
  const promises = {
    rm: jest.fn(),
    mkdir: jest.fn(),
    symlink: jest.fn(),
    writeFile: jest.fn(),
  };
  return { default: { promises }, promises };
});

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const context = {
  logger,
  directories: {
    emails: '/test/.lowdefy/emails',
    server: '/test/.lowdefy/server',
  },
};

const notificationTypes = {
  NotificationEmail: {
    originalTypeName: 'NotificationEmail',
    package: '@lowdefy/email-templates',
    version: '5.3.0',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('generateEmailShims recreates the emails directory and links node_modules', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({ context, notifications: [], appEmail: {}, notificationTypes });

  expect(fs.promises.rm).toHaveBeenCalledWith('/test/.lowdefy/emails', {
    recursive: true,
    force: true,
  });
  expect(fs.promises.mkdir).toHaveBeenCalledWith('/test/.lowdefy/emails', { recursive: true });
  expect(fs.promises.symlink).toHaveBeenCalledWith(
    expect.stringContaining('server'),
    expect.stringContaining('emails'),
    'junction'
  );
});

test('generateEmailShims writes a wrapper shim with merged theme and testData', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({
    context,
    notifications: [
      {
        notificationId: 'task-assigned',
        type: 'NotificationEmail',
        properties: { subject: 'New Task' },
        theme: { logo: 'https://cdn/override.png' },
        testData: { contact: { _id: 'UC-1' } },
      },
    ],
    appEmail: { companyName: 'MyApp', logo: 'https://cdn/default.png' },
    notificationTypes,
  });

  expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
  const [filePath, content] = fs.promises.writeFile.mock.calls[0];
  expect(filePath).toContain('task-assigned.jsx');
  expect(content).toContain(
    "import { NotificationEmail as Template } from '@lowdefy/email-templates/notifications';"
  );
  expect(content).toContain("import { buildPreviewProps } from '@lowdefy/email-templates';");
  expect(content).toContain('function TaskAssignedPreview(props)');
  expect(content).toContain('TaskAssignedPreview.PreviewProps');
  expect(content).toContain('React.createElement(Template, props)');
  const config = JSON.parse(content.match(/const config = ([\s\S]*?);\n\nfunction/)[1]);
  expect(config.theme).toEqual({ companyName: 'MyApp', logo: 'https://cdn/override.png' });
  expect(config.testData).toEqual({ contact: { _id: 'UC-1' } });
});

test('generateEmailShims drops a relative logo from the preview theme', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({
    context,
    notifications: [
      { notificationId: 'task-assigned', type: 'NotificationEmail', properties: { subject: 'x' } },
    ],
    appEmail: { companyName: 'MyApp', logo: '/logo-light.png' },
    notificationTypes,
  });

  const content = fs.promises.writeFile.mock.calls[0][1];
  const config = JSON.parse(content.match(/const config = ([\s\S]*?);\n\nfunction/)[1]);
  expect(config.theme).toEqual({ companyName: 'MyApp' });
});

test('generateEmailShims keeps absolute and protocol-relative logos in the preview theme', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({
    context,
    notifications: [
      { notificationId: 'task-assigned', type: 'NotificationEmail', properties: { subject: 'x' } },
      {
        notificationId: 'task-done',
        type: 'NotificationEmail',
        properties: { subject: 'y' },
        theme: { logo: '//cdn/other.png' },
      },
    ],
    appEmail: { logo: 'https://cdn/logo.png' },
    notificationTypes,
  });

  const absolute = JSON.parse(
    fs.promises.writeFile.mock.calls[0][1].match(/const config = ([\s\S]*?);\n\nfunction/)[1]
  );
  expect(absolute.theme).toEqual({ logo: 'https://cdn/logo.png' });
  const protocolRelative = JSON.parse(
    fs.promises.writeFile.mock.calls[1][1].match(/const config = ([\s\S]*?);\n\nfunction/)[1]
  );
  expect(protocolRelative.theme).toEqual({ logo: '//cdn/other.png' });
});

test('generateEmailShims creates the parent directory for scoped notification ids', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({
    context,
    notifications: [
      {
        notificationId: 'invites/invite-user',
        type: 'NotificationEmail',
        properties: { subject: 'Invite' },
      },
    ],
    appEmail: {},
    notificationTypes,
  });

  expect(fs.promises.mkdir).toHaveBeenCalledWith(expect.stringContaining('invites'), {
    recursive: true,
  });
  const [filePath, content] = fs.promises.writeFile.mock.calls[0];
  expect(filePath).toContain('invites');
  expect(filePath).toContain('invite-user.jsx');
  expect(content).toContain('function InvitesInviteUserPreview(props)');
});

test('generateEmailShims warns and skips notifications with unknown template types', async () => {
  const fs = (await import('fs')).default;
  const { default: generateEmailShims } = await import('./generateEmailShims.js');

  await generateEmailShims({
    context,
    notifications: [
      { notificationId: 'mystery', type: 'UnknownEmail', properties: { subject: 'x' } },
    ],
    appEmail: {},
    notificationTypes,
  });

  expect(fs.promises.writeFile).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('UnknownEmail'));
});
