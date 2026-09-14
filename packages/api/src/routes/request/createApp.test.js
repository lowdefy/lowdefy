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

import createApp from './createApp.js';
import testContext from '../../test/testContext.js';

// A real request resolver so app.callRequest runs the whole callRequest path:
// config lookup, authorizeRequest, connection checks, and the resolver.
const mockTestRequest = jest.fn(({ request, connection }) => ({ request, connection }));
mockTestRequest.schema = { type: 'object' };
mockTestRequest.meta = { checkRead: false, checkWrite: false };

const connections = {
  TestConnection: {
    schema: { type: 'object' },
    requests: { TestRequest: mockTestRequest },
  },
};

const publicPage = { id: 'page:public', pageId: 'public', type: 'Box', auth: { public: true } };
const protectedPage = {
  id: 'page:secret',
  pageId: 'secret',
  type: 'Box',
  auth: { public: false },
};
const connectionConfig = {
  id: 'connection:testConnection',
  type: 'TestConnection',
  connectionId: 'testConnection',
  properties: {},
};
const publicRequest = {
  id: 'request:public:getData',
  requestId: 'getData',
  type: 'TestRequest',
  connectionId: 'testConnection',
  auth: { public: true },
  properties: { requestProperty: 'requestProperty' },
};
const protectedRequest = {
  ...publicRequest,
  id: 'request:public:getSecret',
  requestId: 'getSecret',
  auth: { public: false },
};

const readConfigFile = jest.fn(async (path) => {
  const files = {
    'pages/public.json': publicPage,
    'pages/secret.json': protectedPage,
    'pages/public/requests/getData.json': publicRequest,
    'pages/public/requests/getSecret.json': protectedRequest,
    'connections/testConnection.json': connectionConfig,
    'plugins/blockMetas.json': { Box: { category: 'container' } },
    'global.json': { g: 1 },
    'reports/styles.css': '.secondary{color:grey}',
  };
  return files[path] ?? null;
});

function makeContext({ session, ...overrides } = {}) {
  return {
    ...testContext({ connections, readConfigFile, session }),
    origin: 'https://app.example.com',
    publicDirectory: '/srv/app/public',
    reportsRuntime: {
      blocksStatic: { Title: { toReport: () => ({}) } },
      clientOperators: { _if: () => {} },
      clientJsMap: { fn_1: () => {} },
      icons: { Home: () => {} },
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('capability fields', () => {
  test('createApp exposes the reports runtime artifact, origin, public directory, user, and logger', () => {
    const context = makeContext({ session: { user: { id: 'user_1' } } });
    const app = createApp(context);
    expect(app.blocksStatic).toBe(context.reportsRuntime.blocksStatic);
    expect(app.clientOperators).toBe(context.reportsRuntime.clientOperators);
    expect(app.clientJsMap).toBe(context.reportsRuntime.clientJsMap);
    expect(app.icons).toBe(context.reportsRuntime.icons);
    expect(app.origin).toBe('https://app.example.com');
    expect(app.publicDirectory).toBe('/srv/app/public');
    expect(app.user).toEqual({ id: 'user_1' });
    expect(app.logger).toBe(context.logger);
  });

  test('createApp defaults the runtime maps to empty objects when the artifact is absent', () => {
    const app = createApp(makeContext({ reportsRuntime: undefined }));
    expect(app.blocksStatic).toEqual({});
    expect(app.clientOperators).toEqual({});
    expect(app.clientJsMap).toEqual({});
    expect(app.icons).toEqual({});
  });

  test('createApp does not hand out the raw config reader', () => {
    const app = createApp(makeContext());
    expect(app.readConfigFile).toBeUndefined();
  });

  test('createApp system flag is true only for an explicit system context', () => {
    expect(createApp(makeContext({ system: true })).system).toBe(true);
    // An anonymous visitor has no user either, and is not a system context.
    expect(createApp(makeContext({ session: undefined })).system).toBe(false);
    expect(createApp(makeContext({ session: { user: { id: 'u' } } })).system).toBe(false);
  });

  test('requestTimeout comes from config.requestTimeout when set, including zero', () => {
    expect(createApp(makeContext({ config: { requestTimeout: 12000 } })).requestTimeout).toBe(
      12000
    );
    expect(createApp(makeContext({ config: { requestTimeout: 0 } })).requestTimeout).toBe(0);
  });

  test('requestTimeout defaults to 30000 when config has none', () => {
    expect(createApp(makeContext({ config: {} })).requestTimeout).toBe(30000);
    expect(createApp(makeContext({ config: undefined })).requestTimeout).toBe(30000);
  });
});

describe('artifact readers', () => {
  test('readBlockMetas and readGlobal return the parsed artifacts', async () => {
    const app = createApp(makeContext());
    expect(await app.readBlockMetas()).toEqual({ Box: { category: 'container' } });
    expect(await app.readGlobal()).toEqual({ g: 1 });
    expect(readConfigFile).toHaveBeenCalledWith('plugins/blockMetas.json');
    expect(readConfigFile).toHaveBeenCalledWith('global.json');
  });

  test('readBlockMetas and readGlobal return empty objects when the artifact is missing', async () => {
    const app = createApp(makeContext({ readConfigFile: async () => null }));
    expect(await app.readBlockMetas()).toEqual({});
    expect(await app.readGlobal()).toEqual({});
  });

  test('readReportStylesheet returns the compiled css, or undefined when the build wrote none', async () => {
    expect(await createApp(makeContext()).readReportStylesheet()).toBe('.secondary{color:grey}');
    const app = createApp(makeContext({ readConfigFile: async () => null }));
    expect(await app.readReportStylesheet()).toBeUndefined();
  });
});

describe('getPageConfig', () => {
  test('returns the built page for a public page without its auth key', async () => {
    const app = createApp(makeContext());
    const page = await app.getPageConfig({ pageId: 'public' });
    expect(page.pageId).toBe('public');
    expect(page.auth).toBeUndefined();
  });

  test('returns null for a protected page when the session is not authenticated', async () => {
    const app = createApp(makeContext({ session: undefined }));
    expect(await app.getPageConfig({ pageId: 'secret' })).toBeNull();
  });

  test('returns the protected page when the session is authenticated', async () => {
    const app = createApp(makeContext({ session: { user: { id: 'user_1' } } }));
    const page = await app.getPageConfig({ pageId: 'secret' });
    expect(page.pageId).toBe('secret');
  });

  test('returns null for an unknown page, indistinguishable from an unauthorised one', async () => {
    const app = createApp(makeContext({ session: { user: { id: 'user_1' } } }));
    expect(await app.getPageConfig({ pageId: 'missing' })).toBeNull();
  });
});

describe('callRequest', () => {
  test('runs the request through the real request pipeline on a fresh child context at render depth 1', async () => {
    const context = makeContext();
    const app = createApp(context);
    const result = await app.callRequest({ pageId: 'public', requestId: 'getData', payload: {} });
    expect(result).toEqual({
      id: 'request:public:getData',
      success: true,
      type: 'TestRequest',
      response: { request: { requestProperty: 'requestProperty' }, connection: {} },
    });
    // callRequest mutates the context it is handed; the caller's own context must
    // not pick up the request's pageId or depth.
    expect(context.renderDepth).toBeUndefined();
    expect(context.pageId).toBeUndefined();
  });

  test('refuses a request the session is not authorised for without revealing it exists', async () => {
    const app = createApp(makeContext({ session: undefined }));
    await expect(
      app.callRequest({ pageId: 'public', requestId: 'getSecret', payload: {} })
    ).rejects.toThrow('Request "getSecret" does not exist.');
    expect(mockTestRequest).not.toHaveBeenCalled();
  });

  test('allows the protected request when the session is authenticated', async () => {
    const app = createApp(makeContext({ session: { user: { id: 'user_1' } } }));
    const result = await app.callRequest({ pageId: 'public', requestId: 'getSecret', payload: {} });
    expect(result.success).toBe(true);
  });

  test('a context already at render depth 1 refuses to call requests again', () => {
    const app = createApp(makeContext({ renderDepth: 1 }));
    expect(() => app.callRequest({ pageId: 'public', requestId: 'getData' })).toThrow(ConfigError);
    expect(() => app.callRequest({ pageId: 'public', requestId: 'getData' })).toThrow(
      /render depth exceeded maximum of 1/i
    );
    expect(mockTestRequest).not.toHaveBeenCalled();
  });

  test('renderDepth on the app reflects the depth the resolver runs at', () => {
    expect(createApp(makeContext()).renderDepth).toBe(0);
    expect(createApp(makeContext({ renderDepth: 1 })).renderDepth).toBe(1);
  });

  test('concurrent requests never share a context', async () => {
    const app = createApp(makeContext());
    const [a, b] = await Promise.all([
      app.callRequest({ pageId: 'public', requestId: 'getData', payload: { n: 1 } }),
      app.callRequest({ pageId: 'public', requestId: 'getData', payload: { n: 2 } }),
    ]);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(mockTestRequest).toHaveBeenCalledTimes(2);
  });
});
