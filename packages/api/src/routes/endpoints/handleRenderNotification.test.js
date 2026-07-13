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

const mockRenderEmail = jest.fn();
const mockInterpolateProperties = jest.fn();

function createNotificationConfig(overrides = {}) {
  return {
    id: 'notification:task-assigned',
    notificationId: 'task-assigned',
    type: 'NotificationEmail',
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
    if (path === 'app.json') {
      return app;
    }
    return null;
  });
}

function createTestContext({ notificationConfig, app } = {}) {
  const context = testContext({
    appMeta: { name: 'test-app' },
    config: { basePath: '' },
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

function createStep({ data, serverUrl, landingPage, recordId, properties }) {
  return {
    id: 'notification:test_endpoint:render',
    type: 'RenderNotification',
    stepId: 'render',
    endpointId: 'test_endpoint',
    properties: properties ?? {
      notificationId: 'task-assigned',
      data,
      serverUrl,
      landingPage,
      recordId,
    },
  };
}

const contact = { _id: 'UC-1', email: 'Jane@Example.com', profile: { name: 'Jane' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderEmail.mockResolvedValue({ html: '<html>body</html>', text: 'plain body' });
  mockInterpolateProperties.mockImplementation(({ properties }) => properties);
});

test('RenderNotification returns subject, title, preview, html, text and the resolved data', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, task: { title: 'Review' } } }),
  });

  expect(res.status).toBe('continue');
  expect(routineContext.steps.render).toEqual({
    subject: 'New Task',
    title: 'Task assigned to you',
    preview: 'A task was assigned.',
    html: '<html>body</html>',
    text: 'plain body',
    data: { contact, task: { title: 'Review' } },
  });
});

test('RenderNotification title falls back to subject and preview derives from message markdown', async () => {
  mockInterpolateProperties.mockImplementation(() => ({
    subject: 'Weekly digest',
    message: '**Bold** start of the message body',
  }));
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(routineContext.steps.render.title).toBe('Weekly digest');
  expect(routineContext.steps.render.preview).toBe('Bold start of the message body');
});

test('RenderNotification errors when data is an array', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: [{ contact }] }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'iterate with a ":for" control and render one item per step'
  );
});

test('RenderNotification errors when data is not an object', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: 'not-an-object' }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('properties.data must evaluate to an object.');
});

test('RenderNotification errors when notificationId is not a string', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ properties: { notificationId: 7, data: { contact } } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('properties.notificationId must evaluate to a string.');
});

test('RenderNotification resolves pageId links to landing URLs when landingPage and recordId are set', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
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
    routine: createStep({
      data,
      serverUrl: 'https://myapp.com',
      landingPage: '/notifications/link',
      recordId: 'rec-1',
    }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toContain('https://myapp.com/notifications/link?');
  expect(renderArgs.links.button).toContain('_id=rec-1');
  expect(renderArgs.links.button).toContain('option=links.button');
  const query = new URLSearchParams(renderArgs.links.button.split('?')[1]);
  expect([...query.keys()].sort()).toEqual(['_id', 'option']);
  expect(renderArgs.links.external).toBe('https://other.example/page');
  expect(renderArgs.data.actions[0].link).toContain('option=actions.0.link');

  // The result carries the resolved copy; the input item is not mutated, so
  // callers can store the original link objects on their record.
  expect(routineContext.steps.render.data.links.button).toContain('option=links.button');
  expect(data.links.button).toEqual({ pageId: 'task-view', urlQuery: { _id: 'T-1' } });
});

test('RenderNotification resolves pageId links directly when landingPage is unset', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
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
    routine: createStep({ data, serverUrl: 'https://myapp.com' }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toBe('https://myapp.com/task-view?_id=T-1');
  expect(renderArgs.links.plain).toBe('https://myapp.com/home');
  expect(renderArgs.links.external).toBe('https://other.example/page');
});

test('RenderNotification resolves array link fields for the data keys the template declares', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  // Custom template declaring its own data key — link resolution must follow it
  context.notifications.NotificationEmail.dataKeys = ['rows'];
  const routineContext = createRoutineContext();

  const data = {
    contact,
    rows: [{ title: 'Row', link: { pageId: 'row-view' } }],
    actions: [{ title: 'Ignored', link: { pageId: 'action-view' } }],
  };
  const res = await runRoutine(context, routineContext, {
    routine: createStep({
      data,
      serverUrl: 'https://myapp.com',
      landingPage: '/notifications/link',
      recordId: 'rec-2',
    }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.data.rows[0].link).toContain('option=rows.0.link');
  // 'actions' is not one of this template's dataKeys — left untouched
  expect(renderArgs.data.actions[0].link).toEqual({ pageId: 'action-view' });
  context.notifications.NotificationEmail.dataKeys = ['actions'];
});

test('RenderNotification normalizes a trailing slash on serverUrl', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({
      data: { contact, links: { button: { pageId: 'home' } } },
      serverUrl: 'https://myapp.com/',
    }),
  });

  expect(res.status).toBe('continue');
  const renderArgs = mockRenderEmail.mock.calls[0][0];
  expect(renderArgs.links.button).toBe('https://myapp.com/home');
});

test('RenderNotification errors when links are present and no serverUrl is set', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact, links: { button: { pageId: 'home' } } } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Set the serverUrl step property.');
  expect(mockRenderEmail).not.toHaveBeenCalled();
});

test('RenderNotification errors when landingPage is set without recordId and links are present', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({
      data: { contact, links: { button: { pageId: 'home' } } },
      serverUrl: 'https://myapp.com',
      landingPage: '/notifications/link',
    }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'properties.landingPage requires properties.recordId to compose landing URLs.'
  );
});

test('RenderNotification errors when serverUrl is not a non-empty string', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact }, serverUrl: '' }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'properties.serverUrl must evaluate to a non-empty string.'
  );
});

test('RenderNotification interpolates properties with the resolved data item and markdownProperties', async () => {
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

test('RenderNotification errors when interpolation fails', async () => {
  mockInterpolateProperties.mockImplementation(() => {
    throw new Error('unexpected token');
  });
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'Notification "task-assigned" template interpolation failed: unexpected token'
  );
});

test('RenderNotification errors when properties do not match the template schema', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  context.notifications.NotificationEmail.schema = {
    type: 'object',
    properties: { subject: { type: 'string' } },
    required: ['subject', 'button'],
  };
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'properties do not match template "NotificationEmail" schema'
  );
  delete context.notifications.NotificationEmail.schema;
});

test('RenderNotification errors when the template type is not registered', async () => {
  const context = createTestContext({
    notificationConfig: createNotificationConfig({ type: 'MissingEmail' }),
  });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'Notification template type "MissingEmail" can not be found.'
  );
});

test('RenderNotification errors when email rendering is not available', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  context.renderEmail = undefined;
  context.interpolateProperties = undefined;
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ data: { contact } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Email rendering is not available.');
});

test('RenderNotification errors when the notification does not exist', async () => {
  const context = createTestContext({ notificationConfig: createNotificationConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: createStep({ properties: { notificationId: 'missing', data: { contact } } }),
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Notification "missing" does not exist.');
});

test('RenderNotification merges notification theme over app.email', async () => {
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
