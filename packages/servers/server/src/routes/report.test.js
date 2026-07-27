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

import { Hono } from 'hono';
import { jest } from '@jest/globals';
import buildTestPage from '@lowdefy/build/buildTestPage';
import * as operatorsClient from '@lowdefy/operators-js/operators/client';
import { operatorsServer } from '@lowdefy/operators-js';
import { generateReport, text, table } from '@lowdefy/reports';

import reportHandler from './report.js';

const clientOperators = { ...operatorsClient };

// Minimal static renderers — the route only passes the registry through; the
// real renderers are covered in @lowdefy/reports. A Paragraph emits a text
// node (PDF), a Grid emits a table node (xlsx).
const pdfRegistry = {
  Paragraph: { toReport: ({ block }) => text({ text: block.properties?.content ?? '' }) },
};
const xlsxRegistry = {
  Grid: {
    toReport: () =>
      table({
        header: [{ value: 'Region' }, { value: 'Total' }],
        rows: [[{ value: 'N' }, { value: 1 }]],
      }),
  },
};

const blockMetas = {
  Box: { category: 'container' },
  Paragraph: { category: 'display' },
  Grid: { category: 'display' },
};

// A page authorization identical to viewing: mirrors createAuthorize semantics
// for both page and request configs (both carry `.auth`).
function makeAuthorize(session) {
  const roles = session?.user?.roles ?? [];
  return function authorize({ auth }) {
    if (auth.public === true) return true;
    if (auth.roles) return !!session && auth.roles.some((r) => roles.includes(r));
    return !!session;
  };
}

// A recording request resolver — the fixture asserts on the properties it
// receives (the state snapshot forwarded through the request payload).
function makeConnections(resolver) {
  resolver.meta = { checkRead: false, checkWrite: false };
  resolver.schema = {};
  return { TestConnection: { schema: { type: 'object' }, requests: { TestRequest: resolver } } };
}

function makeContext({
  pageConfig,
  registry = pdfRegistry,
  metas = blockMetas,
  session,
  resolver = jest.fn(({ request }) => ({ ok: true, request })),
  requestAuth = { public: true },
  requestPayloadOp,
}) {
  const pageId = pageConfig?.pageId ?? pageConfig?.id;
  const connectionConfig = {
    id: 'connection:testConnection',
    type: 'TestConnection',
    connectionId: 'testConnection',
    properties: {},
  };
  const requestConfig = {
    id: `request:${pageId}:getData`,
    type: 'TestRequest',
    requestId: 'getData',
    pageId,
    connectionId: 'testConnection',
    auth: requestAuth,
    properties: requestPayloadOp ? { forwarded: requestPayloadOp } : {},
  };
  const readConfigFile = jest.fn(async (p) => {
    if (p === `pages/${pageId}.json`) return pageConfig;
    if (p === `pages/${pageId}/requests/getData.json`) return requestConfig;
    if (p === 'connections/testConnection.json') return connectionConfig;
    return null;
  });
  const context = {
    authorize: makeAuthorize(session),
    connections: makeConnections(resolver),
    logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    operators: operatorsServer,
    origin: 'https://reports.example.com',
    readConfigFile,
    secrets: {},
    session,
    report: {
      generateReport,
      registry,
      operators: clientOperators,
      jsMap: {},
      blockMetas: metas,
      stylesheets: undefined,
      publicDir: '/nonexistent',
    },
  };
  return { context, resolver, pageId };
}

function createApp(context) {
  const app = new Hono();
  app.use('/api/report/*', async (c, next) => {
    c.set('lowdefyContext', context);
    await next();
  });
  app.post('/api/report/*', reportHandler);
  return app;
}

function post(app, pageId, body = {}) {
  return app.request(`/api/report/${pageId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const displayPage = () =>
  buildTestPage({
    pageConfig: {
      id: 'report1',
      type: 'Box',
      auth: { public: true },
      blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'Body text' } }],
    },
  });

describe('POST /api/report/:pageId', () => {
  test('authorized page returns %PDF bytes with attachment headers', async () => {
    const { context } = makeContext({ pageConfig: displayPage() });
    const res = await post(createApp(context), 'report1');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="report1.pdf"');
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('unknown page and unauthorized page return identical 404s', async () => {
    // Unknown page: readConfigFile returns null for the missing file.
    const { context: unknownCtx } = makeContext({ pageConfig: displayPage() });
    const unknownRes = await post(createApp(unknownCtx), 'does-not-exist');
    // Unauthorized: the page exists but the anonymous session may not view it.
    // buildTestPage derives auth from buildAuth (app-level config, defaults
    // public), so stamp the built page with the private auth shape directly.
    const privatePage = {
      ...buildTestPage({
        pageConfig: {
          id: 'report1',
          type: 'Box',
          blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'secret' } }],
        },
      }),
      auth: { public: false },
    };
    const { context: privateCtx } = makeContext({ pageConfig: privatePage });
    const privateRes = await post(createApp(privateCtx), 'report1');

    expect(unknownRes.status).toBe(404);
    expect(privateRes.status).toBe(404);
    expect(await unknownRes.text()).toBe(await privateRes.text());
  });

  test('format xlsx returns the xlsx contentType', async () => {
    const gridPage = buildTestPage({
      pageConfig: {
        id: 'report1',
        type: 'Box',
        auth: { public: true },
        blocks: [{ id: 'g', type: 'Grid', properties: {} }],
      },
    });
    const { context } = makeContext({ pageConfig: gridPage, registry: xlsxRegistry });
    const res = await post(createApp(context), 'report1', { format: 'xlsx' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="report1.xlsx"');
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  test('a custom filename is honored and sanitized', async () => {
    const { context } = makeContext({ pageConfig: displayPage() });
    const res = await post(createApp(context), 'report1', { filename: 'Q3/"report".pdf' });
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="Q3report.pdf"');
  });
});

// A page whose onInit issues one request reading the state snapshot in its
// payload. The recording resolver forwards that payload value back, so the
// fixture can assert the snapshot reached the request.
function requestPage() {
  return buildTestPage({
    pageConfig: {
      id: 'report1',
      type: 'Box',
      auth: { public: true },
      events: { onInit: [{ id: 'req', type: 'Request', params: 'getData' }] },
      requests: [{ id: 'getData', type: 'Fetch', payload: { echo: { _state: 'filter' } } }],
      blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'hi' } }],
    },
  });
}

describe('per-request authorization and the state snapshot', () => {
  test('body state snapshot reaches init requests', async () => {
    const { context, resolver } = makeContext({
      pageConfig: requestPage(),
      requestPayloadOp: { _payload: 'echo' },
    });
    const res = await post(createApp(context), 'report1', { state: { filter: 'MYFILTER' } });
    expect(res.status).toBe(200);
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver.mock.calls[0][0].request.forwarded).toBe('MYFILTER');
  });

  test('a request the user may not call fails the render (authorizeRequest gate holds)', async () => {
    const { context, resolver } = makeContext({
      pageConfig: requestPage(),
      requestAuth: { public: false },
      requestPayloadOp: { _payload: 'echo' },
    });
    const res = await post(createApp(context), 'report1', { state: { filter: 'MYFILTER' } });
    // The render still produces a document, but the gated request never reached
    // its resolver — the data a user could not load never appears.
    expect(res.status).toBe(200);
    expect(resolver).not.toHaveBeenCalled();
  });
});
