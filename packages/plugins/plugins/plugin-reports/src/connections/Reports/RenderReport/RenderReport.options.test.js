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

// generateReport is mocked here, and only here, to assert what RenderReport
// hands it: the real render path is covered by RenderReport.test.js.
jest.unstable_mockModule('../../../generateReport.js', () => ({
  default: jest.fn(async () => ({
    buffer: Buffer.from('%PDF-1.7 report bytes'),
    contentType: 'application/pdf',
    filename: 'page1.pdf',
    warnings: { skippedActions: [], skippedBlockTypes: [], renderErrors: [], mountEvents: [] },
  })),
}));

const { default: generateReport } = await import('../../../generateReport.js');
const { default: RenderReport } = await import('./RenderReport.js');

function makeApp(overrides = {}) {
  return {
    getPageConfig: jest.fn(async () => ({ id: 'page1', type: 'Box' })),
    readBlockMetas: jest.fn(async () => ({ Box: { category: 'container' } })),
    readGlobal: jest.fn(async () => ({ g: 1 })),
    readReportStylesheet: jest.fn(async () => '.secondary{color:grey}'),
    callRequest: jest.fn(),
    blocksStatic: { Box: { toReport: () => ({}) } },
    clientOperators: { _if: () => {} },
    clientJsMap: { fn_1: () => {} },
    icons: { Home: () => {} },
    origin: 'https://app.example.com',
    publicDirectory: '/srv/app/public',
    renderDepth: 0,
    requestTimeout: 30000,
    system: false,
    user: { id: 'user_1' },
    logger: { debug: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

function optionsOf() {
  return generateReport.mock.calls[0][0];
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('assembles options from the app capability and the request snapshot', async () => {
  const app = makeApp();
  await RenderReport({
    request: { pageId: 'page1', urlQuery: { tab: 'sales' }, input: { a: 1 }, state: { b: 2 } },
    app,
  });

  expect(app.getPageConfig).toHaveBeenCalledWith({ pageId: 'page1', urlQuery: { tab: 'sales' } });
  const options = optionsOf();
  expect(options.pageConfig).toEqual({ id: 'page1', type: 'Box' });
  expect(options.format).toBe('pdf');
  expect(options.snapshot).toEqual({
    urlQuery: { tab: 'sales' },
    input: { a: 1 },
    state: { b: 2 },
  });
  expect(options.invocation).toBe('user');
  expect(options.callRequest).toBe(app.callRequest);
  expect(options.operators).toBe(app.clientOperators);
  expect(options.jsMap).toBe(app.clientJsMap);
  expect(options.blockMetas).toEqual({ Box: { category: 'container' } });
  expect(options.registry).toEqual({ Box: app.blocksStatic.Box });
  expect(options.icons).toBe(app.icons);
  expect(options.stylesheets).toBe('.secondary{color:grey}');
  expect(options.lowdefyGlobal).toEqual({ g: 1 });
  expect(options.user).toBe(app.user);
  expect(options.serverUrl).toBe('https://app.example.com');
  expect(options.origin).toBe('https://app.example.com');
  expect(options.publicDirectory).toBe('/srv/app/public');
  expect(options.logger).toBe(app.logger);
});

test('passes the requested format through', async () => {
  await RenderReport({ request: { pageId: 'page1', format: 'xlsx' }, app: makeApp() });
  expect(optionsOf().format).toBe('xlsx');
});

describe('invocation comes from the system flag, not from the user', () => {
  test('a system context renders as system', async () => {
    await RenderReport({
      request: { pageId: 'page1' },
      app: makeApp({ system: true, user: undefined }),
    });
    expect(optionsOf().invocation).toBe('system');
    expect(optionsOf().user).toBeNull();
  });

  test('an anonymous visitor (no user, not system) renders as user', async () => {
    await RenderReport({
      request: { pageId: 'page1' },
      app: makeApp({ system: false, user: undefined }),
    });
    expect(optionsOf().invocation).toBe('user');
    expect(optionsOf().user).toBeNull();
  });
});

describe('the generation timeout follows the request timeout', () => {
  test('sits a margin below the request timeout', async () => {
    await RenderReport({ request: { pageId: 'page1' }, app: makeApp({ requestTimeout: 30000 }) });
    expect(optionsOf().timeoutMs).toBe(28000);
  });

  test('a tiny request timeout floors the generation timeout instead of going negative', async () => {
    await RenderReport({ request: { pageId: 'page1' }, app: makeApp({ requestTimeout: 500 }) });
    expect(optionsOf().timeoutMs).toBe(1000);
  });

  test('zero means no HTTP deadline, so the plugin default applies', async () => {
    await RenderReport({ request: { pageId: 'page1' }, app: makeApp({ requestTimeout: 0 }) });
    expect(optionsOf().timeoutMs).toBeUndefined();
  });

  test('a missing request timeout also leaves the plugin default in place', async () => {
    await RenderReport({
      request: { pageId: 'page1' },
      app: makeApp({ requestTimeout: undefined }),
    });
    expect(optionsOf().timeoutMs).toBeUndefined();
  });
});

test('renders without a stylesheet when the artifact is absent', async () => {
  const app = makeApp({
    readReportStylesheet: jest.fn(async () => undefined),
    readBlockMetas: jest.fn(async () => ({})),
    readGlobal: jest.fn(async () => ({})),
  });
  await RenderReport({ request: { pageId: 'page1' }, app });
  expect(optionsOf().stylesheets).toBeUndefined();
  expect(optionsOf().blockMetas).toEqual({});
  expect(optionsOf().lowdefyGlobal).toEqual({});
});

test('collects per-block report options from the built page config', async () => {
  const app = makeApp({
    getPageConfig: jest.fn(async () => ({
      id: 'page1',
      type: 'Box',
      blockId: 'page1',
      slots: {
        content: {
          blocks: [
            { blockId: 'secret_grid', type: 'AgGridAlpine', report: { exclude: true } },
            { blockId: 'sales', type: 'AgGridAlpine', report: { sheetName: 'Sales' } },
          ],
        },
      },
    })),
  });
  await RenderReport({ request: { pageId: 'page1' }, app });
  expect(optionsOf().reportOptions).toEqual({
    secret_grid: { exclude: true },
    sales: { sheetName: 'Sales' },
  });
});
