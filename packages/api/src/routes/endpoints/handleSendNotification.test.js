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
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockSend = jest.fn();
const mockInsertNotification = jest.fn();
const mockUpdateNotificationSendResult = jest.fn();
const mockRenderEmail = jest.fn();
const mockInterpolateProperties = jest.fn();

function createNotificationConfig(overrides = {}) {
  return {
    id: 'notification:task-assigned',
    notificationId: 'task-assigned',
    type: 'NotificationEmail',
    emailConnectionId: 'smtp',
    dataConnectionId: 'mongodb',
    delivery: 'inline',
    properties: {
      subject: 'New Task',
      title: 'Task assigned to you',
      message: 'A task was assigned.',
    },
    ...overrides,
  };
}

function createMockReadConfigFile({ notificationConfig, app = {} }) {
  return jest.fn((path) => {
    if (notificationConfig && path === `notifications/${notificationConfig.notificationId}.json`) {
      return notificationConfig;
    }
    if (path === 'connections/smtp.json') {
      return {
        id: 'connection:smtp',
        connectionId: 'smtp',
        type: 'SMTP',
        properties: { host: 'smtp.test', from: 'notify@test.com' },
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
    if (path === 'app.json') {
      return app;
    }
    return null;
  });
}

function createTestContext({ notificationConfig, app, connections } = {}) {
  const context = testContext({
    appMeta: { name: 'test-app' },
    config: { basePath: '' },
    connections: connections ?? {
      SMTP: { email: { send: mockSend }, requests: {} },
      MongoDBCollection: {
        notificationAdapter: {
          insertNotification: mockInsertNotification,
          updateNotificationSendResult: mockUpdateNotificationSendResult,
        },
        requests: {},
      },
    },
    operators,
    logger,
    readConfigFile: createMockReadConfigFile({ notificationConfig, app }),
  });
  context.notifications = {
    NotificationEmail: Object.assign(jest.fn(), {
      markdownProperties: ['message'],
      dataKeys: ['actions'],
    }),
  };
  context.renderEmail = mockRenderEmail;
  context.interpolateProperties = mockInterpolateProperties;
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext(overrides = {}) {
  return {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
    ...overrides,
  };
}

function createStep({ data }) {
  return {
    id: 'notification:test_endpoint:send',
    type: 'SendNotification',
    stepId: 'send',
    endpointId: 'test_endpoint',
    properties: { notificationId: 'task-assigned', data },
  };
}

const contact = { _id: 'UC-1', email: 'Jane@Example.com', profile: { name: 'Jane' } };

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.VERCEL_URL;
  mockSend.mockResolvedValue({ messageId: 'msg-1' });
  mockInsertNotification.mockImplementation(({ notification }) => notification);
  mockUpdateNotificationSendResult.mockResolvedValue(undefined);
  mockRenderEmail.mockResolvedValue({ html: '<html>body</html>', text: 'plain body' });
  mockInterpolateProperties.mockImplementation(({ properties }) => properties);
});

test('SendNotification inserts a record and sends inline', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('continue');
  expect(mockInsertNotification).toHaveBeenCalledTimes(1);
  const record = mockInsertNotification.mock.calls[0][0].notification;
  expect(record).toMatchObject({
    key: null,
    type: 'task-assigned',
    template: 'NotificationEmail',
    contact_id: 'UC-1',
    email: 'jane@example.com',
    is_valid_email: true,
    subject: 'New Task',
    title: 'Task assigned to you',
    body: '<html>body</html>',
    text: 'plain body',
    send_email: true,
    sent: false,
    send_attempts: 0,
    read: false,
  });
  // UI-only hints like popup are app data — never hoisted onto the record
  expect(record.popup).toBeUndefined();
  expect(record.created.app_name).toBe('test-app');
  expect(record.created.timestamp).toBeInstanceOf(Date);

  expect(mockSend).toHaveBeenCalledTimes(1);
  expect(mockSend.mock.calls[0][0].mail).toMatchObject({
    to: 'jane@example.com',
    subject: 'New Task',
    html: '<html>body</html>',
    text: 'plain body',
  });
  expect(mockSend.mock.calls[0][0].connection).toMatchObject({ host: 'smtp.test' });

  expect(mockUpdateNotificationSendResult).toHaveBeenCalledWith(
    expect.objectContaining({
      id: record._id,
      sent: true,
      email_result: expect.objectContaining({ messageId: 'msg-1' }),
    })
  );
  expect(routineContext.steps.send).toEqual([record._id]);
});

test('SendNotification creates one record per array data item', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({
      data: [
        { contact },
        { contact: { _id: 'UC-2', email: 'sam@example.com' } },
      ],
    }),
  });

  expect(res.status).toBe('continue');
  expect(mockInsertNotification).toHaveBeenCalledTimes(2);
  expect(mockSend).toHaveBeenCalledTimes(2);
  expect(routineContext.steps.send).toHaveLength(2);
});

test('SendNotification with send_email false inserts the record but does not send', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, send_email: false } }),
  });

  expect(res.status).toBe('continue');
  expect(mockInsertNotification).toHaveBeenCalledTimes(1);
  expect(mockInsertNotification.mock.calls[0][0].notification.send_email).toBe(false);
  expect(mockSend).not.toHaveBeenCalled();
});

test('SendNotification with an invalid email creates the record with is_valid_email false and skips send', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact: { _id: 'UC-3', email: 'not-an-email' } } }),
  });

  expect(res.status).toBe('continue');
  const record = mockInsertNotification.mock.calls[0][0].notification;
  expect(record.is_valid_email).toBe(false);
  expect(mockSend).not.toHaveBeenCalled();
  expect(routineContext.steps.send).toHaveLength(1);
});

test('SendNotification skips duplicates silently when insertNotification returns null', async () => {
  mockInsertNotification.mockResolvedValue(null);
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, deduplication_key: 'dup-1' } }),
  });

  expect(res.status).toBe('continue');
  expect(mockInsertNotification.mock.calls[0][0].notification.key).toBe('dup-1');
  expect(mockSend).not.toHaveBeenCalled();
  expect(routineContext.steps.send).toEqual([]);
});

test('SendNotification with delivery deferred inserts only', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig({ delivery: 'deferred' }),
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('continue');
  expect(mockInsertNotification).toHaveBeenCalledTimes(1);
  expect(mockSend).not.toHaveBeenCalled();
  expect(mockUpdateNotificationSendResult).not.toHaveBeenCalled();
  expect(routineContext.steps.send).toHaveLength(1);
});

test('SendNotification records a failed send and continues the step', async () => {
  mockSend.mockRejectedValue(new Error('SMTP connection refused'));
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('continue');
  expect(mockUpdateNotificationSendResult).toHaveBeenCalledWith(
    expect.objectContaining({
      increment_send_attempts: true,
      last_attempt: expect.any(Date),
    })
  );
  expect(logger.warn).toHaveBeenCalled();
  expect(routineContext.steps.send).toHaveLength(1);
});

test('SendNotification resolves pageId links to landing URLs when notificationLandingPage is set', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig(),
    app: {
      serverUrl: 'https://myapp.com',
      notificationLandingPage: '/notifications/link',
      email: {},
    },
  });
  const routineContext = createRoutineContext();

  const data = {
    contact,
    links: {
      button: { pageId: 'task-view', urlQuery: { _id: 'T-1' } },
      external: 'https://other.example/page',
    },
    actions: [{ title: 'Open', link: { pageId: 'task-edit' } }],
  };
  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data }),
  });

  expect(res.status).toBe('continue');
  const recordId = routineContext.steps.send[0];

  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toContain('https://myapp.com/notifications/link?');
  expect(renderArgs.links.button).toContain(`_id=${recordId}`);
  expect(renderArgs.links.button).toContain('option=links.button');
  const query = new URLSearchParams(renderArgs.links.button.split('?')[1]);
  expect([...query.keys()].sort()).toEqual(['_id', 'option']);
  expect(renderArgs.links.external).toBe('https://other.example/page');
  expect(renderArgs.data.actions[0].link).toContain('option=actions.0.link');

  // Stored record keeps the original link objects for in-app navigation
  const record = mockInsertNotification.mock.calls[0][0].notification;
  expect(record.data.links.button).toEqual({ pageId: 'task-view', urlQuery: { _id: 'T-1' } });
});

test('SendNotification resolves pageId links directly when notificationLandingPage is unset', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig(),
    app: { serverUrl: 'https://myapp.com', email: {} },
  });
  const routineContext = createRoutineContext();

  const data = {
    contact,
    links: {
      button: { pageId: 'task-view', urlQuery: { _id: 'T-1' } },
      plain: { pageId: 'home' },
      external: 'https://other.example/page',
    },
  };
  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toBe('https://myapp.com/task-view?_id=T-1');
  expect(renderArgs.links.plain).toBe('https://myapp.com/home');
  expect(renderArgs.links.external).toBe('https://other.example/page');

  // Stored record still keeps the original link objects
  const record = mockInsertNotification.mock.calls[0][0].notification;
  expect(record.data.links.button).toEqual({ pageId: 'task-view', urlQuery: { _id: 'T-1' } });
});

test('SendNotification resolves array link fields for the data keys the template declares', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig(),
    app: { serverUrl: 'https://myapp.com', notificationLandingPage: '/notifications/link' },
  });
  // Custom template declaring its own data key — link resolution must follow it
  context.notifications.NotificationEmail.dataKeys = ['rows'];
  const routineContext = createRoutineContext();

  const data = {
    contact,
    rows: [{ title: 'Row', link: { pageId: 'row-view' } }],
    actions: [{ title: 'Ignored', link: { pageId: 'action-view' } }],
  };
  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.data.rows[0].link).toContain('option=rows.0.link');
  // 'actions' is not one of this template's dataKeys — left untouched
  expect(renderArgs.data.actions[0].link).toEqual({ pageId: 'action-view' });
  context.notifications.NotificationEmail.dataKeys = ['actions'];
});

test('SendNotification falls back to VERCEL_URL when app.serverUrl is unset', async () => {
  process.env.VERCEL_URL = 'my-app.vercel.app';
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, links: { button: { pageId: 'home' } } } }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toBe('https://my-app.vercel.app/home');
});

test('SendNotification errors when links are present and no server URL is available', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, links: { button: { pageId: 'home' } } } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Set app.serverUrl.');
  expect(mockInsertNotification).not.toHaveBeenCalled();
});

test('SendNotification interpolates properties with the data item and markdownProperties', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, task: { title: 'Review' } } }),
  });

  const args = mockInterpolateProperties.mock.calls[0][0];
  expect(args.properties).toEqual(createNotificationConfig().properties);
  expect(args.data.task).toEqual({ title: 'Review' });
  expect(args.markdownProperties).toEqual(['message']);
});

test('SendNotification title falls back to subject and preview derives from message', async () => {
  mockInterpolateProperties.mockImplementation(() => ({
    subject: 'Weekly digest',
    message: '**Bold** start of the message body',
  }));
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  const record = mockInsertNotification.mock.calls[0][0].notification;
  expect(record.title).toBe('Weekly digest');
  expect(record.preview).toBe('Bold start of the message body');
});

test('SendNotification errors when the template type is not registered', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig({ type: 'MissingEmail' }),
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Notification template type "MissingEmail" can not be found.');
});

test('SendNotification errors when the email connection lacks email.send', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig(),
    connections: {
      SMTP: { requests: {} },
      MongoDBCollection: {
        notificationAdapter: {
          insertNotification: mockInsertNotification,
          updateNotificationSendResult: mockUpdateNotificationSendResult,
        },
        requests: {},
      },
    },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('does not support sending email');
});

test('SendNotification errors when the data connection lacks a notificationAdapter', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig(),
    connections: {
      SMTP: { email: { send: mockSend }, requests: {} },
      MongoDBCollection: { requests: {} },
    },
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('does not provide a notificationAdapter');
});

test('SendNotification errors when a data item has no contact', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { task: { title: 'No contact' } } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('requires a "contact" object with an "_id"');
});

test('SendNotification errors when the notification does not exist', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      ...createStep({ data: { contact } }),
      properties: { notificationId: 'missing', data: { contact } },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Notification "missing" does not exist.');
});

test('SendNotification merges notification theme over app.email', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig({ theme: { logo: 'https://cdn/x.png' } }),
    app: { email: { companyName: 'MyApp', logo: 'https://cdn/default.png' } },
  });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(mockRenderEmail.mock.calls[0][0].theme).toEqual({
    companyName: 'MyApp',
    logo: 'https://cdn/x.png',
  });
});
