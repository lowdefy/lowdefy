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
import { ConfigError } from '@lowdefy/errors';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import handleRenderReport from './handleRenderReport.js';
import runRoutine from './runRoutine.js';
import runScheduledEndpoint from './runScheduledEndpoint.js';
import testContext from '../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const pdfBuffer = Buffer.from('%PDF-1.4 fixture bytes', 'utf8');

// The report seam the server builds on the context (middleware/apiContext.js).
// @lowdefy/api never imports @lowdefy/reports — generateReport is injected, so
// the tests assert on the arguments the step passes it.
const mockGenerateReport = jest.fn(async () => ({
  buffer: pdfBuffer,
  contentType: 'application/pdf',
  filename: 'sales_dashboard.pdf',
  warnings: { skippedActions: ['setState'], skippedBlockTypes: ['CustomChart'] },
}));

const mockMailSend = jest.fn(() => ({ messageId: 'msg-1' }));
mockMailSend.schema = {};
mockMailSend.meta = { checkRead: false, checkWrite: false };

const connections = {
  SMTP: {
    schema: {},
    requests: { SMTPMailSend: mockMailSend },
  },
};

function createReadConfigFile({ pageAuth = { public: true }, endpointConfig } = {}) {
  return jest.fn((path) => {
    if (path === 'pages/sales_dashboard.json') {
      return {
        id: 'page:sales_dashboard',
        pageId: 'sales_dashboard',
        auth: pageAuth,
        blocks: [],
      };
    }
    if (path === 'connections/email.json') {
      return { id: 'connection:email', type: 'SMTP', connectionId: 'email', properties: {} };
    }
    if (path === 'global.json') {
      return { company: 'Lowdefy' };
    }
    if (endpointConfig && path === `api/${endpointConfig.endpointId}.json`) {
      return endpointConfig;
    }
    return null;
  });
}

function createTestContext({ pageAuth, endpointConfig, session = { user: { id: 'u1' } } } = {}) {
  const context = testContext({
    appMeta: { name: 'test-app' },
    connections,
    logger,
    operators,
    readConfigFile: createReadConfigFile({ pageAuth, endpointConfig }),
    session,
  });
  context.origin = 'https://app.example.com';
  context.report = {
    generateReport: mockGenerateReport,
    operators: { _user: () => 'client' },
    jsMap: {},
    blockMetas: { Box: { category: 'container' } },
    registry: { Paragraph: {} },
    stylesheets: 'body{}',
    publicDir: '/app/dist/client',
  };
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

function reportStep(properties = { pageId: 'sales_dashboard' }) {
  return {
    id: 'report:email_sales_report:report',
    stepId: 'report',
    endpointId: 'email_sales_report',
    type: 'RenderReport',
    properties,
  };
}

// The design's user-triggered email example: render, then attach.
const sendStep = {
  id: 'request:email_sales_report:send',
  stepId: 'send',
  endpointId: 'email_sales_report',
  type: 'SMTPMailSend',
  connectionId: 'email',
  properties: {
    to: 'sales@example.com',
    subject: 'Your Sales Report',
    text: 'The report you requested is attached.',
    attachments: [
      {
        filename: { _step: 'report.name' },
        content: { _step: 'report.content' },
        encoding: 'base64',
        contentType: { _step: 'report.type' },
      },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateReport.mockResolvedValue({
    buffer: pdfBuffer,
    contentType: 'application/pdf',
    filename: 'sales_dashboard.pdf',
    warnings: { skippedActions: ['setState'], skippedBlockTypes: ['CustomChart'] },
  });
});

test('RenderReport → SMTPMailSend attaches the generated file', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext({ payload: { region: 'emea' } });

  const res = await runRoutine(context, routineContext, {
    routine: [
      reportStep({
        pageId: 'sales_dashboard',
        format: 'pdf',
        urlQuery: { region: { _payload: 'region' } },
      }),
      sendStep,
    ],
  });

  expect(res.status).toEqual('continue');
  expect(routineContext.steps.report).toEqual({
    name: 'sales_dashboard.pdf',
    size: pdfBuffer.length,
    type: 'application/pdf',
    content: pdfBuffer.toString('base64'),
  });
  // Valid base64 that round-trips to the generated bytes.
  expect(Buffer.from(routineContext.steps.report.content, 'base64')).toEqual(pdfBuffer);

  expect(mockGenerateReport).toHaveBeenCalledTimes(1);
  const generateArgs = mockGenerateReport.mock.calls[0][0];
  expect(generateArgs.pageConfig.pageId).toEqual('sales_dashboard');
  // The auth key never reaches the render.
  expect(generateArgs.pageConfig.auth).toBeUndefined();
  expect(generateArgs.format).toEqual('pdf');
  expect(generateArgs.snapshot).toEqual({
    urlQuery: { region: 'emea' },
    input: undefined,
    state: undefined,
  });
  expect(generateArgs.invocation).toEqual('user');
  expect(generateArgs.user).toEqual({ id: 'u1' });
  expect(generateArgs.serverUrl).toEqual('https://app.example.com');
  expect(generateArgs.lowdefyGlobal).toEqual({ company: 'Lowdefy' });

  expect(mockMailSend).toHaveBeenCalledTimes(1);
  const [attachment] = mockMailSend.mock.calls[0][0].request.attachments;
  expect(attachment).toEqual({
    filename: 'sales_dashboard.pdf',
    content: pdfBuffer.toString('base64'),
    encoding: 'base64',
    contentType: 'application/pdf',
  });
  expect(Buffer.from(attachment.content, 'base64').toString('utf8')).toEqual(
    '%PDF-1.4 fixture bytes'
  );
});

test('the routine log includes the generation warning summary', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  await handleRenderReport(context, routineContext, { step: reportStep() });

  const [logObject, logMessage] = logger.info.mock.calls.find(
    ([entry]) => entry.event === 'report_step_generated'
  );
  expect(logObject).toMatchObject({
    endpointId: 'email_sales_report',
    stepId: 'report',
    pageId: 'sales_dashboard',
    format: 'pdf',
    invocation: 'user',
    size: pdfBuffer.length,
    warnings: { skippedActions: ['setState'], skippedBlockTypes: ['CustomChart'] },
  });
  expect(logMessage).toContain('1 skipped action(s)');
  expect(logMessage).toContain('1 unsupported block type(s)');
});

test('properties.filename overrides the generated filename', async () => {
  const context = createTestContext();
  const routineContext = createRoutineContext();
  await handleRenderReport(context, routineContext, {
    step: reportStep({ pageId: 'sales_dashboard', filename: 'Q3 Sales.pdf' }),
  });
  expect(routineContext.steps.report.name).toEqual('Q3 Sales.pdf');
});

test('a scheduled run renders as system and surfaces the _user ConfigError', async () => {
  // The fail-fast lives in the headless render (@lowdefy/reports); the step's job
  // is to pass invocation: 'system' and let the error through.
  mockGenerateReport.mockImplementation(async ({ invocation }) => {
    if (invocation === 'system') {
      throw new ConfigError(
        "Page 'sales_dashboard' uses _user and cannot be rendered on a schedule; pass explicit parameters via the schedule payload instead."
      );
    }
    return { buffer: pdfBuffer, contentType: 'application/pdf', filename: 'x.pdf', warnings: {} };
  });

  const endpointConfig = {
    id: 'endpoint:monthly_sales_report',
    endpointId: 'monthly_sales_report',
    type: 'InternalApi',
    auth: { public: false },
    schedules: [{ cron: '0 6 1 * *', payload: { region: 'emea' } }],
    routine: [
      {
        id: 'report:monthly_sales_report:report',
        stepId: 'report',
        endpointId: 'monthly_sales_report',
        type: 'RenderReport',
        properties: { pageId: 'sales_dashboard', format: 'xlsx' },
      },
    ],
  };
  const context = createTestContext({ endpointConfig, session: null });

  const result = await runScheduledEndpoint(context, {
    endpointId: 'monthly_sales_report',
    cron: '0 6 1 * *',
  });

  expect(result.success).toBe(false);
  // The routine's error goes through context.handleError, which the test context
  // logs — the serialized response error carries no message.
  expect(
    logger.error.mock.calls.some(
      ([error]) =>
        error?.message ===
        "Page 'sales_dashboard' uses _user and cannot be rendered on a schedule; pass explicit parameters via the schedule payload instead."
    )
  ).toBe(true);
  expect(mockGenerateReport.mock.calls[0][0].invocation).toEqual('system');
  expect(mockGenerateReport.mock.calls[0][0].user).toEqual(null);
});

test('output over the 25 MB cap throws', async () => {
  mockGenerateReport.mockResolvedValue({
    buffer: Buffer.alloc(30 * 1024 * 1024),
    contentType: 'application/pdf',
    filename: 'sales_dashboard.pdf',
    warnings: {},
  });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  await expect(handleRenderReport(context, routineContext, { step: reportStep() })).rejects.toThrow(
    'RenderReport step "report" generated 30.0 MB for page "sales_dashboard", which is 40.0 MB ' +
      'as an attachment — over the 25.0 MB limit.'
  );
  expect(routineContext.steps.report).toBeUndefined();
});

// The cap is on the attachment, and base64 inflates the document by a third — so
// a document comfortably under 25 MB can still be an attachment no provider takes.
test('a document under the cap that encodes over it throws', async () => {
  mockGenerateReport.mockResolvedValue({
    buffer: Buffer.alloc(20 * 1024 * 1024),
    contentType: 'application/pdf',
    filename: 'sales_dashboard.pdf',
    warnings: {},
  });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  await expect(handleRenderReport(context, routineContext, { step: reportStep() })).rejects.toThrow(
    'generated 20.0 MB for page "sales_dashboard", which is 26.7 MB as an attachment'
  );
  expect(routineContext.steps.report).toBeUndefined();
});

test('output over 10 MB warns but still returns the file', async () => {
  const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
  mockGenerateReport.mockResolvedValue({
    buffer: largeBuffer,
    contentType: 'application/pdf',
    filename: 'sales_dashboard.pdf',
    warnings: {},
  });
  const context = createTestContext();
  const routineContext = createRoutineContext();

  await handleRenderReport(context, routineContext, { step: reportStep() });

  expect(routineContext.steps.report.size).toEqual(largeBuffer.length);
  expect(logger.warn.mock.calls.some(([entry]) => entry.event === 'report_step_large')).toBe(true);
});

test('a page the caller may not view fails as if it does not exist', async () => {
  const context = createTestContext({ pageAuth: { public: false }, session: null });
  const routineContext = createRoutineContext();

  await expect(handleRenderReport(context, routineContext, { step: reportStep() })).rejects.toThrow(
    'RenderReport step "report" cannot render page "sales_dashboard": the page does not exist.'
  );
  // Identical failure for a page that really is missing — no existence oracle.
  await expect(
    handleRenderReport(context, createRoutineContext(), {
      step: reportStep({ pageId: 'no_such_page' }),
    })
  ).rejects.toThrow(
    'RenderReport step "report" cannot render page "no_such_page": the page does not exist.'
  );
  expect(mockGenerateReport).not.toHaveBeenCalled();
});

test('properties.pageId must evaluate to a non-empty string', async () => {
  const context = createTestContext();
  await expect(
    handleRenderReport(context, createRoutineContext(), {
      step: reportStep({ pageId: { _payload: 'missing' } }),
    })
  ).rejects.toThrow(
    'RenderReport step "report" properties.pageId must evaluate to a non-empty string. Received null.'
  );
});

test('properties.state must evaluate to an object', async () => {
  const context = createTestContext();
  await expect(
    handleRenderReport(context, createRoutineContext({ payload: { state: 'nope' } }), {
      step: reportStep({ pageId: 'sales_dashboard', state: { _payload: 'state' } }),
    })
  ).rejects.toThrow(
    'RenderReport step "report" properties.state must evaluate to an object. Received "nope".'
  );
});
