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

// What a view session may reach, through the functions the page, request,
// endpoint, websocket and agent routes call. One built app is served to every
// test: the view page "task" with what the build listed for it, and beside it
// pages, endpoints, a websocket and an agent that no view page uses.

import { vi, beforeEach, describe, expect, test } from 'vitest';

import authorizeViewAgent from '../../agent/authorizeViewAgent.js';
import callAgent from '../../agent/callAgent.js';
import callEndpoint from '../../endpoints/callEndpoint.js';
import callRequest from '../../request/callRequest.js';
import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import createChannelRegistry from '../../websocket/createChannelRegistry.js';
import getPageConfig from '../../page/getPageConfig.js';
import invokeEndpoint from '../../endpoints/invokeEndpoint.js';
import prepareChannel from '../../websocket/prepareChannel.js';
import testContext from '../../../test/testContext.js';

const protectedAuth = { public: false };
const adminAuth = { public: false, roles: ['admin'] };

function page({ pageId, ...rest }) {
  return { id: `page:${pageId}`, pageId, auth: protectedAuth, ...rest };
}

function request({ pageId, requestId, type = 'Read', auth = protectedAuth }) {
  return {
    id: `request:${pageId}:${requestId}`,
    requestId,
    pageId,
    type,
    connectionId: 'db',
    auth,
    properties: {},
  };
}

function endpoint({ endpointId, auth = protectedAuth }) {
  return { endpointId, type: 'Api', auth, routine: { ':return': endpointId } };
}

function websocket({ websocketId, auth = protectedAuth }) {
  return {
    id: `websocket:${websocketId}`,
    websocketId,
    type: 'Feed',
    auth,
    properties: { publish: true },
  };
}

const viewPages = {
  task: {
    endpoints: [
      { id: 'admin_save', scope: 'mcp:write' },
      { id: 'read_tasks', scope: 'mcp:read' },
      { id: 'save_task', scope: 'mcp:write' },
    ],
    websockets: ['task-feed'],
    agents: [],
  },
  board: { endpoints: [], websockets: [], agents: [] },
  field: { endpoints: [], websockets: [], agents: [] },
  everywhere: { endpoints: [], websockets: [], agents: [] },
};

function createFiles({ views = { configured: true, pages: viewPages, sources: [] } } = {}) {
  return {
    'routes.json': ['task', 'board', 'field', 'everywhere', 'settings'].map((pageId) => ({
      pageId,
      path: pageId,
      auth: protectedAuth,
    })),
    'mcp.json': { configured: true, endpoints: [], views },
    'pages/task.json': page({ pageId: 'task', view: true }),
    'pages/board.json': page({ pageId: 'board', view: true, auth: adminAuth }),
    'pages/field.json': page({ pageId: 'field', view: true, target: 'mobile' }),
    'pages/everywhere.json': page({ pageId: 'everywhere', view: true, target: 'both' }),
    'pages/settings.json': page({ pageId: 'settings' }),
    'pages/task/requests/read.json': request({ pageId: 'task', requestId: 'read' }),
    'pages/task/requests/write.json': request({
      pageId: 'task',
      requestId: 'write',
      type: 'Write',
    }),
    'pages/board/requests/read.json': request({
      pageId: 'board',
      requestId: 'read',
      auth: adminAuth,
    }),
    'pages/field/requests/read.json': request({ pageId: 'field', requestId: 'read' }),
    'pages/settings/requests/read.json': request({ pageId: 'settings', requestId: 'read' }),
    'connections/db.json': {
      id: 'connection:db',
      connectionId: 'db',
      type: 'Db',
      properties: { write: true },
    },
    'api/read_tasks.json': endpoint({ endpointId: 'read_tasks' }),
    'api/save_task.json': endpoint({ endpointId: 'save_task' }),
    'api/admin_save.json': endpoint({ endpointId: 'admin_save', auth: adminAuth }),
    // A tool of the MCP server that no view page calls.
    'api/list_all.json': endpoint({ endpointId: 'list_all' }),
    'websockets/task-feed.json': websocket({ websocketId: 'task-feed' }),
    'websockets/other-feed.json': websocket({ websocketId: 'other-feed' }),
    'agents/helper.json': {
      id: 'agent:helper',
      agentId: 'helper',
      type: 'Chat',
      connectionId: 'db',
      auth: protectedAuth,
      tools: [],
      properties: {},
    },
  };
}

const readResolver = vi.fn(async () => 'read');
readResolver.schema = {};
readResolver.meta = { checkRead: false, checkWrite: false };
const writeResolver = vi.fn(async () => 'written');
writeResolver.schema = {};
writeResolver.meta = { checkRead: false, checkWrite: true };
const agentResolver = vi.fn(async () => ({ response: 'stream' }));
const feedResolver = vi.fn();
feedResolver.meta = { checkRead: false, publish: true };

const member = { id: 'user_1', roles: ['field'] };

function createContext({ files = createFiles(), system, user = member, viewSession } = {}) {
  const readConfigFile = vi.fn(async (path) => files[path] ?? null);
  const context = testContext({
    connections: {
      Db: {
        schema: {},
        create: () => ({}),
        requests: { Read: readResolver, Write: writeResolver },
      },
    },
    readConfigFile,
    system,
    user,
  });
  context.agents = { Chat: { resolver: agentResolver, schema: {} } };
  context.websockets = { Feed: feedResolver };
  if (viewSession !== undefined) {
    context.viewSession = viewSession;
  }
  return context;
}

function viewContext({ grantedScopes = ['mcp:read', 'mcp:write'], ...rest } = {}) {
  return createContext({ viewSession: { clientId: 'client_1', grantedScopes }, ...rest });
}

// Every caller that is not a view session, as resolveAuthentication and the
// system context leave them.
const otherCallers = [
  ['a browser session', () => createContext({ viewSession: null })],
  [
    'a phone session',
    () => createContext({ viewSession: null, user: { ...member, session_mobile: true } }),
  ],
  [
    'a strategy caller',
    () => createContext({ viewSession: null, user: { ...member, auth_method: 'apiKey' } }),
  ],
  ['a system context', () => createContext({ system: true, user: null })],
];

const requestParams = { blockId: 'block', payload: {} };
const endpointParams = { blockId: 'block', pageId: 'task', payload: {} };
const agentParams = { pageId: 'task', messages: [{ role: 'user', content: 'Hello' }] };

const opaque = { name: 'AuthorizationError' };
const writeRequired = { name: 'AuthorizationError', code: 'view_write_required' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pages', () => {
  test('a view session is served a view page', async () => {
    const result = await getPageConfig(viewContext(), { path: 'task' });
    expect(result.status).toBe('ok');
    expect(result.pageConfig).toMatchObject({ pageId: 'task', view: true });
  });

  test('a view session gets wrong_surface for a page that is not a view page', async () => {
    const result = await getPageConfig(viewContext(), { path: 'settings' });
    expect(result).toEqual({
      status: 'wrong_surface',
      pageId: 'settings',
      pathParams: {},
      surface: undefined,
    });
  });

  test('the view surface comes from the session, whatever surface the client names', async () => {
    const context = viewContext();
    expect((await getPageConfig(context, { path: 'settings', surface: 'web' })).status).toBe(
      'wrong_surface'
    );
    expect((await getPageConfig(context, { path: 'settings', surface: 'mobile' })).status).toBe(
      'wrong_surface'
    );
    expect((await getPageConfig(context, { path: 'task', surface: 'mobile' })).status).toBe('ok');
  });

  test('a view page the caller lacks the roles for stays unauthorized, never wrong_surface', async () => {
    const result = await getPageConfig(viewContext(), { path: 'board' });
    expect(result.status).toBe('unauthorized');
  });

  test('a path that matches no page stays not_found for a view session', async () => {
    expect((await getPageConfig(viewContext(), { path: 'nowhere' })).status).toBe('not_found');
  });

  test('a view page whose target is mobile is not served to a view session', async () => {
    const result = await getPageConfig(viewContext(), { path: 'field' });
    expect(result).toMatchObject({ status: 'wrong_surface', pageId: 'field', surface: 'mobile' });
  });

  test('a view page whose target is both is served to a view session', async () => {
    expect((await getPageConfig(viewContext(), { path: 'everywhere' })).status).toBe('ok');
  });

  test('a view session whose grant carries no MCP scope is served no page', async () => {
    const result = await getPageConfig(viewContext({ grantedScopes: [] }), { path: 'task' });
    expect(result.status).toBe('wrong_surface');
  });

  test('a view session on a read-only grant is served a view page', async () => {
    const result = await getPageConfig(viewContext({ grantedScopes: ['mcp:read'] }), {
      path: 'task',
    });
    expect(result.status).toBe('ok');
  });

  test.each(otherCallers)('%s is served web pages as before', async (name, create) => {
    expect((await getPageConfig(create(), { path: 'settings' })).status).toBe('ok');
    expect((await getPageConfig(create(), { path: 'task' })).status).toBe('ok');
    expect((await getPageConfig(create(), { path: 'everywhere' })).status).toBe('ok');
    expect((await getPageConfig(create(), { path: 'field' })).status).toBe('wrong_surface');
  });

  test.each(otherCallers)('%s on the mobile surface is served as before', async (name, create) => {
    const surface = 'mobile';
    expect((await getPageConfig(create(), { path: 'field', surface })).status).toBe('ok');
    expect((await getPageConfig(create(), { path: 'everywhere', surface })).status).toBe('ok');
    expect((await getPageConfig(create(), { path: 'task', surface })).status).toBe('wrong_surface');
  });
});

describe('requests', () => {
  test("a view session calls a view page's own request", async () => {
    const result = await callRequest(viewContext(), {
      ...requestParams,
      pageId: 'task',
      requestId: 'read',
    });
    expect(result).toMatchObject({ success: true, response: 'read' });
  });

  test('a view session is refused a request of a page that is not a view page', async () => {
    const context = viewContext();
    await expect(
      callRequest(context, { ...requestParams, pageId: 'settings', requestId: 'read' })
    ).rejects.toMatchObject({ ...opaque, message: 'Request "read" does not exist.' });
    expect(readResolver).not.toHaveBeenCalled();
    // Refused before the request is looked up.
    expect(context.readConfigFile).not.toHaveBeenCalledWith('pages/settings/requests/read.json');
  });

  test('a request that does not exist and one on another page are the same answer to a view session', async () => {
    const onOtherPage = await callRequest(viewContext(), {
      ...requestParams,
      pageId: 'settings',
      requestId: 'read',
    }).catch((error) => error);
    const missing = await callRequest(viewContext(), {
      ...requestParams,
      pageId: 'settings',
      requestId: 'read_missing',
    }).catch((error) => error);
    const missingPage = await callRequest(viewContext(), {
      ...requestParams,
      pageId: 'nowhere',
      requestId: 'read',
    }).catch((error) => error);
    expect(onOtherPage.name).toBe('AuthorizationError');
    expect(missing.name).toBe(onOtherPage.name);
    expect(missing.message).toBe('Request "read_missing" does not exist.');
    expect(missingPage.name).toBe(onOtherPage.name);
    expect(missingPage.message).toBe(onOtherPage.message);
  });

  test('a view session is refused a request of a view page whose target is mobile', async () => {
    await expect(
      callRequest(viewContext(), { ...requestParams, pageId: 'field', requestId: 'read' })
    ).rejects.toMatchObject(opaque);
  });

  test('a view session lacking the roles of a request on a view page is refused as its browser session is', async () => {
    const params = { ...requestParams, pageId: 'board', requestId: 'read' };
    const asView = await callRequest(viewContext(), params).catch((error) => error);
    const asBrowser = await callRequest(createContext({ viewSession: null }), params).catch(
      (error) => error
    );
    expect(asView.name).toBe('AuthorizationError');
    expect(asView.message).toBe(asBrowser.message);
    expect(asView.code).toBeUndefined();
    expect(readResolver).not.toHaveBeenCalled();
  });

  test('with mcp:read only, a request whose resolver writes is refused with view_write_required', async () => {
    await expect(
      callRequest(viewContext({ grantedScopes: ['mcp:read'] }), {
        ...requestParams,
        pageId: 'task',
        requestId: 'write',
      })
    ).rejects.toMatchObject(writeRequired);
    expect(writeResolver).not.toHaveBeenCalled();
  });

  test('with mcp:read only, a request whose resolver reads is served', async () => {
    const result = await callRequest(viewContext({ grantedScopes: ['mcp:read'] }), {
      ...requestParams,
      pageId: 'task',
      requestId: 'read',
    });
    expect(result.success).toBe(true);
  });

  test('with mcp:write, a request whose resolver writes is decided by roles alone', async () => {
    const result = await callRequest(viewContext({ grantedScopes: ['mcp:write'] }), {
      ...requestParams,
      pageId: 'task',
      requestId: 'write',
    });
    expect(result).toMatchObject({ success: true, response: 'written' });
  });

  test('a view session whose grant carries no MCP scope is refused every request', async () => {
    const context = viewContext({ grantedScopes: [] });
    const read = await callRequest(context, {
      ...requestParams,
      pageId: 'task',
      requestId: 'read',
    }).catch((error) => error);
    const write = await callRequest(context, {
      ...requestParams,
      pageId: 'task',
      requestId: 'write',
    }).catch((error) => error);
    expect(read).toMatchObject(opaque);
    expect(read.code).toBeUndefined();
    expect(write).toMatchObject(opaque);
    expect(write.code).toBeUndefined();
  });

  test.each(otherCallers)('%s calls any request as before', async (name, create) => {
    const onViewPage = await callRequest(create(), {
      ...requestParams,
      pageId: 'task',
      requestId: 'write',
    });
    const onOtherPage = await callRequest(create(), {
      ...requestParams,
      pageId: 'settings',
      requestId: 'read',
    });
    expect(onViewPage.success).toBe(true);
    expect(onOtherPage.success).toBe(true);
    const context = create();
    await callRequest(context, { ...requestParams, pageId: 'settings', requestId: 'read' });
    // No view check ran: neither the page nor the view lists were read.
    expect(context.readConfigFile).not.toHaveBeenCalledWith('pages/settings.json');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('mcp.json');
  });
});

describe('endpoints', () => {
  test('a view session calls an endpoint listed for a view page', async () => {
    const result = await callEndpoint(viewContext(), {
      ...endpointParams,
      endpointId: 'read_tasks',
    });
    expect(result).toMatchObject({ success: true, response: 'read_tasks' });
  });

  test('a view session is refused an endpoint no view page lists, though it exists', async () => {
    const context = viewContext();
    await expect(
      callEndpoint(context, { ...endpointParams, endpointId: 'list_all' })
    ).rejects.toMatchObject({ ...opaque, message: 'API Endpoint "list_all" does not exist.' });
    // Refused before the endpoint is looked up.
    expect(context.readConfigFile).not.toHaveBeenCalledWith('api/list_all.json');
  });

  test('an endpoint that is not listed and one that does not exist are the same answer to a view session', async () => {
    const unlisted = await callEndpoint(viewContext(), {
      ...endpointParams,
      endpointId: 'list_all',
    }).catch((error) => error);
    const missing = await callEndpoint(viewContext(), {
      ...endpointParams,
      endpointId: 'no_such',
    }).catch((error) => error);
    expect(missing.name).toBe(unlisted.name);
    expect(missing.message).toBe('API Endpoint "no_such" does not exist.');
    expect(missing.code).toBe(unlisted.code);
  });

  test('with mcp:read only, a listed endpoint whose scope is mcp:write is refused with view_write_required', async () => {
    await expect(
      callEndpoint(viewContext({ grantedScopes: ['mcp:read'] }), {
        ...endpointParams,
        endpointId: 'save_task',
      })
    ).rejects.toMatchObject(writeRequired);
  });

  test('with mcp:read only, a listed endpoint whose scope is mcp:read is served', async () => {
    const result = await callEndpoint(viewContext({ grantedScopes: ['mcp:read'] }), {
      ...endpointParams,
      endpointId: 'read_tasks',
    });
    expect(result.success).toBe(true);
  });

  test('with mcp:write, a listed endpoint whose scope is mcp:write is decided by roles alone', async () => {
    const allowed = await callEndpoint(viewContext({ grantedScopes: ['mcp:write'] }), {
      ...endpointParams,
      endpointId: 'save_task',
    });
    expect(allowed.success).toBe(true);
    await expect(
      callEndpoint(viewContext({ grantedScopes: ['mcp:write'] }), {
        ...endpointParams,
        endpointId: 'admin_save',
      })
    ).rejects.toMatchObject({ ...opaque, message: 'API Endpoint "admin_save" does not exist.' });
  });

  test('a read-only view session lacking the roles of a listed write endpoint gets the role refusal, not view_write_required', async () => {
    const error = await callEndpoint(viewContext({ grantedScopes: ['mcp:read'] }), {
      ...endpointParams,
      endpointId: 'admin_save',
    }).catch((caught) => caught);
    expect(error).toMatchObject(opaque);
    expect(error.code).toBeUndefined();
  });

  test('a view session whose grant carries no MCP scope is refused every endpoint', async () => {
    const error = await callEndpoint(viewContext({ grantedScopes: [] }), {
      ...endpointParams,
      endpointId: 'read_tasks',
    }).catch((caught) => caught);
    expect(error).toMatchObject(opaque);
    expect(error.code).toBeUndefined();
  });

  test('an app with no views configured lists nothing, so a view session calls no endpoint', async () => {
    const files = createFiles({ views: { configured: false, pages: {}, sources: [] } });
    await expect(
      callEndpoint(viewContext({ files }), { ...endpointParams, endpointId: 'read_tasks' })
    ).rejects.toMatchObject(opaque);
  });

  test('an endpoint that a routine calls is not held to the view lists', async () => {
    const context = viewContext({ grantedScopes: ['mcp:read'] });
    context.evaluateOperators = createEvaluateOperators(context);
    const result = await invokeEndpoint(context, {
      endpointId: 'list_all',
      payload: {},
      endpointDepth: 0,
    });
    expect(result).toMatchObject({ status: 'return', response: 'list_all' });
  });

  test.each(otherCallers)('%s calls any endpoint as before', async (name, create) => {
    const context = create();
    const unlisted = await callEndpoint(context, { ...endpointParams, endpointId: 'list_all' });
    const write = await callEndpoint(context, { ...endpointParams, endpointId: 'save_task' });
    expect(unlisted.success).toBe(true);
    expect(write.success).toBe(true);
    expect(context.readConfigFile).not.toHaveBeenCalledWith('mcp.json');
  });
});

describe('websockets', () => {
  test('a view session opens a channel listed for a view page', async () => {
    const result = await prepareChannel(viewContext({ grantedScopes: ['mcp:read'] }), {
      websocketId: 'task-feed',
      payload: {},
    });
    expect(result.websocketConfig.websocketId).toBe('task-feed');
  });

  test('a view session is refused a channel no view page lists, as a channel that does not exist', async () => {
    const context = viewContext();
    const unlisted = await prepareChannel(context, {
      websocketId: 'other-feed',
      payload: {},
    }).catch((error) => error);
    const missing = await prepareChannel(context, {
      websocketId: 'no-feed',
      payload: {},
    }).catch((error) => error);
    expect(unlisted).toMatchObject({
      ...opaque,
      message: 'Websocket "other-feed" does not exist.',
    });
    expect(missing.name).toBe(unlisted.name);
    expect(context.readConfigFile).not.toHaveBeenCalledWith('websockets/other-feed.json');
  });

  test('a view session whose grant carries no MCP scope opens no channel', async () => {
    await expect(
      prepareChannel(viewContext({ grantedScopes: [] }), { websocketId: 'task-feed', payload: {} })
    ).rejects.toMatchObject(opaque);
  });

  test('with mcp:read only, publishing to a listed channel is refused with view_write_required', async () => {
    const registry = createChannelRegistry();
    await expect(
      registry.publish(viewContext({ grantedScopes: ['mcp:read'] }), {
        websocketId: 'task-feed',
        payload: {},
      })
    ).rejects.toMatchObject(writeRequired);
  });

  test('with mcp:write, publishing to a listed channel is decided by roles alone', async () => {
    const registry = createChannelRegistry();
    await expect(
      registry.publish(viewContext(), { websocketId: 'task-feed', payload: {} })
    ).resolves.toBeUndefined();
  });

  test.each(otherCallers)(
    '%s opens and publishes to any channel as before',
    async (name, create) => {
      const context = create();
      const result = await prepareChannel(context, { websocketId: 'other-feed', payload: {} });
      expect(result.websocketConfig.websocketId).toBe('other-feed');
      await expect(
        createChannelRegistry().publish(context, { websocketId: 'other-feed', payload: {} })
      ).resolves.toBeUndefined();
      expect(context.readConfigFile).not.toHaveBeenCalledWith('mcp.json');
    }
  );
});

describe('agents', () => {
  test('a view session is refused every agent, since the build lists none', async () => {
    const context = viewContext();
    const existing = await callAgent(context, { ...agentParams, agentId: 'helper' }).catch(
      (error) => error
    );
    const missing = await callAgent(context, { ...agentParams, agentId: 'no_such' }).catch(
      (error) => error
    );
    expect(existing).toMatchObject(opaque);
    expect(missing.name).toBe(existing.name);
    expect(missing.message).toBe(existing.message.replace('helper', 'no_such'));
    expect(agentResolver).not.toHaveBeenCalled();
    expect(context.readConfigFile).not.toHaveBeenCalledWith('agents/helper.json');
  });

  test('an agent listed for a view page is allowed, and refused to a grant with no MCP scope', async () => {
    const files = createFiles({
      views: {
        configured: true,
        pages: { task: { endpoints: [], websockets: [], agents: ['helper'] } },
        sources: [],
      },
    });
    await expect(
      authorizeViewAgent(viewContext({ files }), { agentId: 'helper' })
    ).resolves.toBeUndefined();
    await expect(
      authorizeViewAgent(viewContext({ files, grantedScopes: [] }), { agentId: 'helper' })
    ).rejects.toMatchObject(opaque);
  });

  test.each(otherCallers)('%s chats with an agent as before', async (name, create) => {
    const context = create();
    const result = await callAgent(context, { ...agentParams, agentId: 'helper' });
    expect(result).toEqual({ response: 'stream' });
    expect(context.readConfigFile).not.toHaveBeenCalledWith('mcp.json');
  });
});
