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

import handleNotificationLanding from './handleNotificationLanding.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockGetNotification = jest.fn();
const mockMarkNotificationRead = jest.fn();

function createMockReadConfigFile() {
  return jest.fn((path) => {
    if (path === 'notifications/task-assigned.json') {
      return {
        id: 'notification:task-assigned',
        notificationId: 'task-assigned',
        type: 'NotificationEmail',
        emailConnectionId: 'smtp',
        dataConnectionId: 'mongodb',
      };
    }
    if (path === 'connections/mongodb.json') {
      return {
        id: 'connection:mongodb',
        connectionId: 'mongodb',
        type: 'MongoDBCollection',
        properties: { databaseUri: 'mongodb://test', collection: 'notifications' },
      };
    }
    return null;
  });
}

function createTestContext() {
  const context = testContext({
    logger,
    operators: {},
    readConfigFile: createMockReadConfigFile(),
    connections: {
      MongoDBCollection: {
        notificationAdapter: {
          insertNotification: jest.fn(),
          getNotification: mockGetNotification,
          markNotificationRead: mockMarkNotificationRead,
        },
        requests: {},
      },
    },
  });
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('handleNotificationLanding marks the record read and redirects to the stored pageId link', async () => {
  mockGetNotification.mockResolvedValue({
    _id: 'rec-1',
    data: { links: { button: { pageId: 'task-view', urlQuery: { _id: 'T-1' } } } },
  });
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'task-assigned',
    option: 'links.button',
  });

  expect(mockMarkNotificationRead).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'rec-1' })
  );
  expect(res.redirect).toBe('/task-view?_id=T-1');
});

test('handleNotificationLanding defaults option to links.button', async () => {
  mockGetNotification.mockResolvedValue({
    _id: 'rec-1',
    data: { links: { button: { pageId: 'home' } } },
  });
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'task-assigned',
  });

  expect(res.redirect).toBe('/home');
});

test('handleNotificationLanding passes absolute URL links through', async () => {
  mockGetNotification.mockResolvedValue({
    _id: 'rec-1',
    data: { links: { external: 'https://other.example/page' } },
  });
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'task-assigned',
    option: 'links.external',
  });

  expect(res.redirect).toBe('https://other.example/page');
});

test('handleNotificationLanding redirects to root when the record is missing', async () => {
  mockGetNotification.mockResolvedValue(null);
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-missing',
    notificationId: 'task-assigned',
  });

  expect(res.redirect).toBe('/');
  expect(mockMarkNotificationRead).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalled();
});

test('handleNotificationLanding redirects to root when the notification config is missing', async () => {
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'missing-notification',
  });

  expect(res.redirect).toBe('/');
  expect(logger.warn).toHaveBeenCalled();
});

test('handleNotificationLanding redirects to root when the stored link is missing', async () => {
  mockGetNotification.mockResolvedValue({ _id: 'rec-1', data: {} });
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'task-assigned',
  });

  expect(res.redirect).toBe('/');
  expect(mockMarkNotificationRead).toHaveBeenCalled();
});

test('handleNotificationLanding never throws when the adapter fails', async () => {
  mockGetNotification.mockRejectedValue(new Error('db down'));
  const context = createTestContext();

  const res = await handleNotificationLanding(context, {
    recordId: 'rec-1',
    notificationId: 'task-assigned',
  });

  expect(res.redirect).toBe('/');
  expect(logger.warn).toHaveBeenCalled();
});
