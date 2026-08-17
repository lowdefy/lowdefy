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

jest.unstable_mockModule('../../../generateReport.js', () => ({
  default: jest.fn(async () => ({
    buffer: Buffer.from('%PDF-1.7 report bytes'),
    contentType: 'application/pdf',
    filename: 'page1.pdf',
    warnings: { skippedActions: [], skippedBlockTypes: [] },
  })),
}));

const { default: generateReport } = await import('../../../generateReport.js');
const { default: RenderReport } = await import('./RenderReport.js');

function makeApp(overrides = {}) {
  const readConfigFile = jest.fn(async (path) => {
    if (path === 'plugins/blockMetas.json') return { Box: { category: 'container' } };
    if (path === 'global.json') return { g: 1 };
    if (path === 'reports/styles.css') return '.secondary{color:grey}';
    return null;
  });
  return {
    getPageConfig: jest.fn(async () => ({ id: 'page1', type: 'Box' })),
    readConfigFile,
    callRequest: jest.fn(),
    blocksStatic: { Box: { toReport: () => ({}) } },
    clientOperators: { _if: () => {} },
    clientJsMap: { fn_1: () => {} },
    icons: { Home: () => {} },
    origin: 'https://app.example.com',
    requestTimeout: 30000,
    user: { id: 'user_1' },
    logger: { debug: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('meta', () => {
  test('declares appAccess and read-only access', () => {
    expect(RenderReport.meta).toEqual({ appAccess: true, checkRead: true, checkWrite: false });
    expect(RenderReport.schema).toBeDefined();
    expect(RenderReport.schema.required).toEqual(['pageId']);
  });
});

describe('envelope', () => {
  test('returns a base64 file envelope built from the generated buffer', async () => {
    const app = makeApp();
    const result = await RenderReport({ request: { pageId: 'page1' }, app });
    expect(result).toEqual({
      name: 'page1.pdf',
      size: Buffer.from('%PDF-1.7 report bytes').length,
      type: 'application/pdf',
      content: Buffer.from('%PDF-1.7 report bytes').toString('base64'),
    });
  });

  test('a requested filename overrides the generated one', async () => {
    const app = makeApp();
    const result = await RenderReport({ request: { pageId: 'page1', filename: 'Q1.pdf' }, app });
    expect(result.name).toBe('Q1.pdf');
  });

  test('a filename that sanitizes to nothing falls back to the generated name', async () => {
    const app = makeApp();
    const result = await RenderReport({ request: { pageId: 'page1', filename: '/\\"' }, app });
    expect(result.name).toBe('page1.pdf');
  });
});

describe('generateReport options', () => {
  test('assembles options from the app capability and the request snapshot', async () => {
    const app = makeApp();
    await RenderReport({
      request: {
        pageId: 'page1',
        urlQuery: { tab: 'sales' },
        input: { a: 1 },
        state: { b: 2 },
      },
      app,
    });

    expect(app.getPageConfig).toHaveBeenCalledWith({ pageId: 'page1', urlQuery: { tab: 'sales' } });
    const options = generateReport.mock.calls[0][0];
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
    expect(options.logger).toBe(app.logger);
  });

  test('the generation timeout sits below the request timeout', async () => {
    const app = makeApp({ requestTimeout: 30000 });
    await RenderReport({ request: { pageId: 'page1' }, app });
    expect(generateReport.mock.calls[0][0].timeoutMs).toBe(28000);
  });

  test('a tiny request timeout floors the generation timeout instead of going negative', async () => {
    const app = makeApp({ requestTimeout: 500 });
    await RenderReport({ request: { pageId: 'page1' }, app });
    expect(generateReport.mock.calls[0][0].timeoutMs).toBe(1000);
  });

  test('passes the requested format through', async () => {
    const app = makeApp();
    await RenderReport({ request: { pageId: 'page1', format: 'xlsx' }, app });
    expect(generateReport.mock.calls[0][0].format).toBe('xlsx');
  });

  test('no user means a system render', async () => {
    const app = makeApp({ user: undefined });
    await RenderReport({ request: { pageId: 'page1' }, app });
    expect(generateReport.mock.calls[0][0].invocation).toBe('system');
    expect(generateReport.mock.calls[0][0].user).toBeNull();
  });

  test('renders without a stylesheet when the artifact is absent', async () => {
    const app = makeApp({ readConfigFile: jest.fn(async () => null) });
    await RenderReport({ request: { pageId: 'page1' }, app });
    const options = generateReport.mock.calls[0][0];
    expect(options.stylesheets).toBeUndefined();
    expect(options.blockMetas).toEqual({});
    expect(options.lowdefyGlobal).toEqual({});
  });
});

describe('authorization masking', () => {
  test('throws one generic error and never renders when the page is null', async () => {
    const app = makeApp({ getPageConfig: jest.fn(async () => null) });
    await expect(RenderReport({ request: { pageId: 'secret' }, app })).rejects.toThrow(
      "Report cannot be rendered for page 'secret'."
    );
    expect(generateReport).not.toHaveBeenCalled();
  });
});
