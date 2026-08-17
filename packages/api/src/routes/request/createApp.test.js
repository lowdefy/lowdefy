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

jest.unstable_mockModule('./callRequest.js', () => ({
  default: jest.fn(() => Promise.resolve({ id: 'req1', success: true, response: 'ok' })),
}));
jest.unstable_mockModule('../page/getPageConfig.js', () => ({
  default: jest.fn(() => Promise.resolve({ id: 'page1' })),
}));

const { default: callRequest } = await import('./callRequest.js');
const { default: getPageConfig } = await import('../page/getPageConfig.js');
const { default: createApp } = await import('./createApp.js');

function makeContext(overrides = {}) {
  return {
    authorize: () => true,
    config: {},
    logger: { debug: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    origin: 'https://app.example.com',
    readConfigFile: jest.fn(() => Promise.resolve({ some: 'artifact' })),
    user: { id: 'user_1' },
    blocksStatic: { Title: { toReport: () => ({}) } },
    clientOperators: { _if: () => {} },
    clientJsMap: { fn_1: () => {} },
    icons: { Home: () => {} },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('static capability fields', () => {
  test('pass build artifacts, origin, user, and logger through from context', () => {
    const context = makeContext();
    const app = createApp(context);
    expect(app.blocksStatic).toBe(context.blocksStatic);
    expect(app.clientOperators).toBe(context.clientOperators);
    expect(app.clientJsMap).toBe(context.clientJsMap);
    expect(app.icons).toBe(context.icons);
    expect(app.origin).toBe('https://app.example.com');
    expect(app.user).toBe(context.user);
    expect(app.logger).toBe(context.logger);
  });

  test('readConfigFile is the context reader', () => {
    const context = makeContext();
    const app = createApp(context);
    expect(app.readConfigFile).toBe(context.readConfigFile);
  });

  test('requestTimeout comes from config.requestTimeout when set', () => {
    const app = createApp(makeContext({ config: { requestTimeout: 12000 } }));
    expect(app.requestTimeout).toBe(12000);
  });

  test('requestTimeout defaults to 30000 when config has none', () => {
    expect(createApp(makeContext({ config: {} })).requestTimeout).toBe(30000);
    expect(createApp(makeContext({ config: undefined })).requestTimeout).toBe(30000);
  });
});

describe('getPageConfig', () => {
  test('forwards to core getPageConfig with the same context and args', async () => {
    const context = makeContext();
    const app = createApp(context);
    const result = await app.getPageConfig({ pageId: 'page1', urlQuery: { a: 1 } });
    expect(result).toEqual({ id: 'page1' });
    expect(getPageConfig).toHaveBeenCalledWith(context, { pageId: 'page1', urlQuery: { a: 1 } });
  });
});

describe('callRequest', () => {
  test('forwards args and increments render depth on a fresh child context', async () => {
    const context = makeContext();
    const app = createApp(context);
    const result = await app.callRequest({
      pageId: 'page1',
      requestId: 'getData',
      payload: { p: 1 },
    });
    expect(result).toEqual({ id: 'req1', success: true, response: 'ok' });

    expect(callRequest).toHaveBeenCalledTimes(1);
    const [childContext, args] = callRequest.mock.calls[0];
    expect(args).toEqual({ pageId: 'page1', requestId: 'getData', payload: { p: 1 } });
    // A fresh clone at render depth 1 — not the caller's own context.
    expect(childContext).not.toBe(context);
    expect(childContext.renderDepth).toBe(1);
    expect(context.renderDepth).toBeUndefined();
  });

  test('a context already at render depth 1 refuses to render again', async () => {
    // The nested case: a report page whose request is itself a RenderReport.
    const context = makeContext({ renderDepth: 1 });
    const app = createApp(context);
    expect(() => app.callRequest({ pageId: 'page1', requestId: 'again' })).toThrow(ConfigError);
    expect(() => app.callRequest({ pageId: 'page1', requestId: 'again' })).toThrow(
      /render depth exceeded maximum of 1/i
    );
    expect(callRequest).not.toHaveBeenCalled();
  });

  test('each call clones a fresh child so concurrent requests never share context', async () => {
    const context = makeContext();
    const app = createApp(context);
    await Promise.all([
      app.callRequest({ pageId: 'page1', requestId: 'a', payload: { n: 1 } }),
      app.callRequest({ pageId: 'page1', requestId: 'b', payload: { n: 2 } }),
    ]);
    const [ctxA] = callRequest.mock.calls[0];
    const [ctxB] = callRequest.mock.calls[1];
    expect(ctxA).not.toBe(ctxB);
    expect(ctxA.renderDepth).toBe(1);
    expect(ctxB.renderDepth).toBe(1);
  });
});
