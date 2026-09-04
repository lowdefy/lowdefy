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

import fs from 'fs';
import path from 'path';

import { jest } from '@jest/globals';

import setupTestFixtures from './setupTestFixtures.mjs';

// The docs service reads build artifacts and node_modules from process.cwd()
// (the running server directory) — point it at the fixture server before the
// modules are imported, since resolvePluginDir captures cwd at import time.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

// runRequest.js calls callRequest (@lowdefy/api) and createLowdefyContext
// (../server/createLowdefyContext.js, which statically imports the running
// server's own build/plugins/*.js — not the app fixture built above, and not
// present in this checkout) — mock both so runRequest can be unit tested
// without a real server build.
const mockCallRequest = jest.fn();
const mockCallConnectionRequest = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  callRequest: mockCallRequest,
  callConnectionRequest: mockCallConnectionRequest,
}));
const mockCreateLowdefyContext = jest.fn(async () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
  // The server's error sink: runRequest hands it a fault so the failure lands
  // in serverErrorStore with its config source resolved.
  handleError: jest.fn(),
}));
jest.unstable_mockModule('../server/createLowdefyContext.js', () => ({
  default: mockCreateLowdefyContext,
}));

// findConfig force-builds a page when pageId is passed — the fixture pages
// only exist as pre-written build artifacts, so stub the JIT builder out.
const mockBuildPageIfNeeded = jest.fn(async () => true);
jest.unstable_mockModule('../server/jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
}));

const { default: listTypes } = await import('./listTypes.js');
const { default: listPlugins } = await import('./listPlugins.js');
const { default: getSchema } = await import('./getSchema.js');
const { default: getExamples } = await import('./getExamples.js');
const { default: getCoreDoc } = await import('./getCoreDoc.js');
const { default: getPluginDoc } = await import('./getPluginDoc.js');
const { default: getOverview } = await import('./getOverview.js');
const { default: searchDocs } = await import('./searchDocs.js');
const { default: normalizeTypeKind } = await import('./normalizeTypeKind.js');
const { default: clientErrorStore } = await import('./clientErrorStore.js');
const { default: getBuildStatus } = await import('./getBuildStatus.js');
const { default: serverErrorStore } = await import('./serverErrorStore.js');
const { default: devNoticeStore } = await import('./devNoticeStore.js');
const { default: getPageConfig } = await import('./getPageConfig.js');
const { default: readPageArtifact } = await import('./readPageArtifact.js');
const { default: findConfig } = await import('./findConfig.js');
const { default: runRequest } = await import('./runRequest.js');
const { default: seedFixture } = await import('./seedFixture.js');
const { default: getAppMap } = await import('./getAppMap.js');
const { default: getDataModel } = await import('./getDataModel.js');
const { default: docsDataModelHandler } = await import('../../src/routes/docs/dataModel.js');

test('listTypes returns all available blocks with used flag and category', () => {
  const blocks = listTypes({ kind: 'blocks' });
  expect(blocks.map((block) => block.type)).toEqual(['Button', 'TestBlock']);
  const button = blocks.find((block) => block.type === 'Button');
  expect(button.used).toBe(true);
  expect(button.category).toEqual('display');
  const testBlock = blocks.find((block) => block.type === 'TestBlock');
  expect(testBlock.used).toBe(false);
  expect(testBlock.package).toEqual('test-plugin');
});

test('listTypes merges client and server operators with environments', () => {
  const operators = listTypes({ kind: 'operators' });
  const get = operators.find((operator) => operator.type === '_get');
  expect(get.environments).toEqual(['client', 'server']);
  expect(get.used).toBe(true);
  const secret = operators.find((operator) => operator.type === '_secret');
  expect(secret.environments).toEqual(['server']);
  expect(secret.used).toBe(false);
});

test('listTypes accepts singular kind names', () => {
  expect(listTypes({ kind: 'block' }).length).toEqual(2);
});

test('listTypes throws on unknown kind', () => {
  expect(() => listTypes({ kind: 'gadgets' })).toThrow('Unknown type kind');
});

test('listPlugins lists packages with their types and custom flag', () => {
  const plugins = listPlugins();
  const testPlugin = plugins.find((plugin) => plugin.package === 'test-plugin');
  expect(testPlugin.custom).toBe(true);
  expect(testPlugin.installed).toBe(true);
  expect(testPlugin.types.blocks).toEqual(['TestBlock']);
  const antd = plugins.find((plugin) => plugin.package === '@lowdefy/blocks-antd');
  expect(antd.custom).toBe(false);
  expect(antd.types.blocks).toEqual(['Button']);
});

test('getSchema returns block schema with meta', () => {
  const result = getSchema({ kind: 'blocks', type: 'Button' });
  expect(result.schema.properties.title).toBeDefined();
  expect(result.meta.category).toEqual('display');
});

test('getSchema returns a block event payload schema under meta.events', () => {
  const result = getSchema({ kind: 'blocks', type: 'TestBlock' });
  expect(result.meta.events).toEqual({
    onChange: {
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: { value: { type: 'string', description: 'The current value.' } },
      },
    },
    onBlur: {},
  });
  // The JSON Schema itself carries only the event description, never the payload.
  expect(result.schema.properties.events?.payload).toBeUndefined();
});

test('getSchema returns hazards for a block: type-attached first, then framework-level', () => {
  const result = getSchema({ kind: 'blocks', type: 'TestBlock' });
  expect(result.hazards.map((hazard) => hazard.id)).toEqual([
    'test-block-hazard',
    'visible-false-prunes-state',
  ]);
  // The plugin's own entry wins a duplicate id.
  expect(result.hazards[1].message).toEqual('Plugin wording for visible: false.');
});

test('getSchema returns hazards for a request, including a meta.hazards entry', () => {
  const result = getSchema({ kind: 'requests', type: 'WriteRequest' });
  expect(result.hazards.map((hazard) => hazard.id)).toEqual(['write-request-hazard']);
});

test('getSchema returns connection schema with request list', () => {
  const result = getSchema({ kind: 'connections', type: 'AxiosHttp' });
  expect(result.schema).toBeDefined();
  expect(result.requests).toEqual(['AxiosHttp']);
});

test('getSchema returns request schema with meta', () => {
  const result = getSchema({ kind: 'requests', type: 'AxiosHttp' });
  expect(result.schema).toBeDefined();
  expect(result.meta).toEqual({ checkRead: false, checkWrite: false });
});

test('getSchema returns null for unknown type', () => {
  expect(getSchema({ kind: 'blocks', type: 'Nope' })).toBeNull();
});

test('getSchema throws for kinds without schemas', () => {
  expect(() => getSchema({ kind: 'websockets', type: 'X' })).toThrow('No schemas available');
});

test('getExamples reads example yaml from plugin dist by convention', () => {
  const result = getExamples({ type: 'TestBlock' });
  expect(result.package).toEqual('test-plugin');
  expect(result.files['gallery.yaml']).toContain('type: TestBlock');
});

test('getExamples returns null for unknown block type', () => {
  expect(getExamples({ type: 'Nope' })).toBeNull();
});

test('getPluginDoc returns README markdown for installed plugin', () => {
  const result = getPluginDoc({ packageName: 'test-plugin' });
  expect(result.markdown).toContain('# test-plugin');
});

test('getPluginDoc returns null for packages without docs', () => {
  expect(getPluginDoc({ packageName: 'no-such-package' })).toBeNull();
});

test('getCoreDoc returns markdown by slug from docs-content', () => {
  const doc = getCoreDoc({ slug: 'operators/_get' });
  expect(doc.title).toEqual('_get');
  expect(doc.markdown).toContain('# _get');
});

test('getCoreDoc resolves a doc by kind and type name', () => {
  const doc = getCoreDoc({ kind: 'operator', type: '_get' });
  expect(doc.slug).toEqual('operators/_get');
});

test('getCoreDoc returns hazards for the requested type when resolved by kind and type', () => {
  const doc = getCoreDoc({ kind: 'operator', type: '_get' });
  expect(doc.hazards.map((hazard) => hazard.id)).toEqual(['get-fixture-hazard']);
});

test('getCoreDoc attaches the page type hazards when resolved by slug', () => {
  // A slug is the natural follow-up to searchDocs, so it must carry the same
  // hazards as the kind/type call for the type the page documents.
  const doc = getCoreDoc({ slug: 'operators/_get' });
  expect(doc.hazards.map((hazard) => hazard.id)).toEqual(['get-fixture-hazard']);
});

test('getCoreDoc resolves a request doc on its connection page but keeps request hazards', () => {
  // findDoc remaps request → connection to find the page; hazards must come
  // from the request kind the caller asked about.
  const doc = getCoreDoc({ kind: 'request', type: 'MongoDBFind' });
  expect(doc.slug).toEqual('connections/mongodb');
  // The framework's request-level hazard was retired by the request-state-empty
  // check, so a request with no meta.hazards resolves to none — and never to the
  // connection page's hazards.
  expect(doc.hazards.map((hazard) => hazard.id)).toEqual([]);
});

test('getCoreDoc returns null for unknown slug', () => {
  expect(getCoreDoc({ slug: 'nope/nope' })).toBeNull();
});

test('searchDocs returns matching docs with snippets', () => {
  const results = searchDocs({ query: 'SetState' });
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].snippet).toBeDefined();
});

test('searchDocs throws on empty query', () => {
  expect(() => searchDocs({ query: '' })).toThrow('requires a "query" string');
});

test('getOverview includes counts and route guidance', () => {
  const overview = getOverview();
  expect(overview).toContain('2 block types');
  expect(overview).toContain('/lowdefy-docs/schema/{kind}/{type}');
  expect(overview).toContain('lowdefy_list_types');
});

test('normalizeTypeKind maps singular and plural, rejects unknown', () => {
  expect(normalizeTypeKind({ kind: 'block' })).toEqual('blocks');
  expect(normalizeTypeKind({ kind: 'REQUESTS' })).toEqual('requests');
  expect(normalizeTypeKind({ kind: 'nope' })).toBeNull();
});

test('clientErrorStore caps at 50 entries, evicting the oldest first', () => {
  for (let i = 0; i < 60; i += 1) {
    clientErrorStore.push({ index: i });
  }
  const entries = clientErrorStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[0].index).toEqual(10);
  expect(entries[49].index).toEqual(59);
});

test('getBuildStatus returns the build artifact plus reported client and server errors and tenant notices', () => {
  serverErrorStore.push({ name: 'RequestError', message: 'Bad filter.', source: 'pages/a.yaml:3' });
  const notice = {
    timestamp: '2026-01-01T00:00:00.000Z',
    name: 'TenantNoneNotice',
    level: 'info',
    message: 'Request "list_all" ran unscoped on tenant connection "app_data" (tenant: none).',
    source: 'pages/a.yaml:9',
    config: 'pages.0.requests.0',
    details: {
      connectionId: 'app_data',
      requestId: 'list_all',
      stepId: null,
      field: 'organization_id',
    },
    configKey: 'request.1',
  };
  devNoticeStore.push(notice);
  const result = getBuildStatus();
  expect(result.build.status).toEqual('ok');
  expect(result.clientErrors.length).toEqual(50);
  expect(result.serverErrors).toEqual([
    { name: 'RequestError', message: 'Bad filter.', source: 'pages/a.yaml:3' },
  ]);
  expect(result.devNotices).toEqual([notice]);
});

test('getBuildStatus returns an empty devNotices list shape when no tenant none request ran', () => {
  expect(Array.isArray(getBuildStatus().devNotices)).toBe(true);
});

test('getBuildStatus reports unknown status when buildStatus.json is missing', () => {
  fs.rmSync(path.join(fixtureDir, 'build', 'buildStatus.json'));
  const result = getBuildStatus();
  expect(result.build.status).toEqual('unknown');
  expect(result.build.message).toContain('No build status yet');
});

test('readPageArtifact reads a built page json artifact', () => {
  const result = readPageArtifact({ pageId: 'home' });
  expect(result.pageId).toEqual('home');
});

test('readPageArtifact returns null when no artifact exists for the pageId', () => {
  expect(readPageArtifact({ pageId: 'no-such-page' })).toBeNull();
});

test('getPageConfig returns null for a pageId not in the page registry', async () => {
  const result = await getPageConfig({ pageId: 'no-such-page' });
  expect(result).toBeNull();
});

test('findConfig resolves a known pageId to its source file', async () => {
  const result = await findConfig({ id: 'home' });
  expect(result.kind).toEqual('page');
  expect(result.pageId).toEqual('home');
  expect(result.file).toEqual('pages/home.yaml');
  // A page's root block renders with blockId === pageId — open-in-editor and
  // feedback enrichment read matches[0].location.source from this result.
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].location.source).toContain('pages/home.yaml');
});

test('findConfig returns no hazards for a block type that declares none', async () => {
  // Button declares no hazards and no framework hazard applies to every block,
  // so a match must not pick one up from a broader kind.
  const result = await findConfig({ id: 'my_button', pageId: 'home' });
  expect(result.matches[0].hazards).toEqual([]);
});

test('findConfig fires tenant-wall-lookup on a request over a walled connection only', async () => {
  const walled = await findConfig({ id: 'req-tenant', pageId: 'other' });
  expect(walled.matches.length).toEqual(1);
  expect(walled.matches[0].hazards.map((hazard) => hazard.id)).toEqual([
    'write-request-hazard',
    'tenant-wall-lookup',
  ]);

  const shared = await findConfig({ id: 'req-shared', pageId: 'other' });
  expect(shared.matches.length).toEqual(1);
  expect(shared.matches[0].hazards.map((hazard) => hazard.id)).toEqual(['write-request-hazard']);
});

test('findConfig resolves a request connection across pages when no pageId is given', async () => {
  const result = await findConfig({ id: 'req-tenant' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].hazards.map((hazard) => hazard.id)).toContain('tenant-wall-lookup');
});

test('findConfig scans keyMap for a matching id when no pageId is given', async () => {
  // my_button exists on both built pages — an unscoped scan returns both.
  const result = await findConfig({ id: 'my_button' });
  expect(result.matches.length).toEqual(2);
  expect(result.matches[0].keyPath).toEqual('root.blocks[2:my_button:Button]');
  expect(result.matches[0].location.source).toContain('pages/home.yaml:5');
  expect(result.matches[1].keyPath).toEqual('root.blocks[0:my_button:Button]');
  expect(result.note).toContain('Pass ?pageId=');
});

test('findConfig with pageId only returns matches on that page', async () => {
  // Both pages hold a my_button whose JIT key paths are indistinguishable
  // (`root.blocks[N:my_button:Button]`) — scoping must resolve through the
  // ~k_parent chain to the page's own subtree root.
  const result = await findConfig({ id: 'my_button', pageId: 'other' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toEqual('root.blocks[0:my_button:Button]');
  expect(result.matches[0].location.source).toContain('pages/other.yaml:4');
});

test('findConfig with pageId resolves the same id to each page respectively', async () => {
  const result = await findConfig({ id: 'my_button', pageId: 'home' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toEqual('root.blocks[2:my_button:Button]');
  expect(result.matches[0].location.source).toContain('pages/home.yaml:5');
});

test('findConfig scopes skeleton-built pages via the page key segment', async () => {
  // Pages built during the skeleton build (e.g. the default 404) chain to the
  // shared config root — the page segment in the key path identifies them.
  const result = await findConfig({ id: 'legal_button', pageId: 'legal' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toEqual('root.pages[2:legal].blocks[0:legal_button:Button]');
  expect(result.matches[0].location.source).toContain('pages/legal.yaml:3');
});

test('findConfig with a skeleton-built pageId does not leak other pages ids', async () => {
  const result = await findConfig({ id: 'my_button', pageId: 'legal' });
  expect(result.matches).toEqual([]);
});

test('findConfig with pageId does not match ids that only exist on other pages', async () => {
  // my_list.$.item_title only exists on home — scoped to "other" it must not
  // resolve, instead of falling back to the wrong page.
  const result = await findConfig({ id: 'my_list.0.item_title', pageId: 'other' });
  expect(result.matches).toEqual([]);
  expect(result.note).toContain('No config found with id "my_list.0.item_title" on page "other"');
});

test('findConfig resolves a runtime list item id to its $ placeholder config id', async () => {
  // A block inside a list renders with array indices applied to its id —
  // the config (and keyMap) hold the `$` form.
  const result = await findConfig({ id: 'my_list.0.item_title' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toContain('[0:my_list.$.item_title:Title]');
  expect(result.matches[0].location.source).toContain('pages/home.yaml:9');
});

test('findConfig resolves a runtime list item id within a pageId scope', async () => {
  const result = await findConfig({ id: 'my_list.0.item_title', pageId: 'home' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toContain('[0:my_list.$.item_title:Title]');
});

test('findConfig de-indexes any list index, not just the first item', async () => {
  const result = await findConfig({ id: 'my_list.17.item_title' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toContain('my_list.$.item_title');
});

test('findConfig prefers an exact id match over de-indexing', async () => {
  // my_button contains no indices — exact scan must resolve it without the
  // de-index retry changing anything.
  const result = await findConfig({ id: 'my_button' });
  expect(result.matches[0].keyPath).toEqual('root.blocks[2:my_button:Button]');
});

test('findConfig returns empty matches with a note when nothing matches', async () => {
  const result = await findConfig({ id: 'no-such-id' });
  expect(result.matches).toEqual([]);
  expect(result.note).toBeDefined();
});

test('findConfig throws when id is missing', async () => {
  await expect(findConfig({ id: undefined })).rejects.toThrow('requires an "id" string');
});

test('runRequest throws when pageId is missing', async () => {
  await expect(runRequest({ requestId: 'req-read' })).rejects.toThrow('requires a "pageId"');
});

test('runRequest throws when requestId is missing', async () => {
  await expect(runRequest({ pageId: 'home' })).rejects.toThrow('requires a "requestId"');
});

test('runRequest refuses when the requestId does not exist on the page', async () => {
  const result = await runRequest({
    pageId: 'home',
    requestId: 'no-such-request',
    honoContext: {},
  });
  expect(result.refused).toBe(true);
  expect(result.reason).toContain('was not found');
  expect(mockCallRequest).not.toHaveBeenCalled();
});

test('runRequest allows a request type with checkWrite: false without the write opt-in', async () => {
  mockCallRequest.mockResolvedValueOnce({
    id: 'req-read',
    success: true,
    type: 'ReadOnlyRequest',
    response: { ok: true },
  });
  const result = await runRequest({ pageId: 'home', requestId: 'req-read', honoContext: {} });
  expect(result.refused).toBe(false);
  expect(result.response).toEqual({ ok: true });
  expect(mockCallRequest).toHaveBeenCalledTimes(1);
});

test('runRequest refuses a checkWrite: true request type when the opt-in is not set', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'req-write', honoContext: {} });
  expect(result.refused).toBe(true);
  expect(result.reason).toContain('checkWrite: true');
  expect(result.howToEnable).toContain('cli.agentTools.allowWriteRequests');
  expect(mockCallRequest).not.toHaveBeenCalled();
});

test('runRequest refuses a request type with no declared meta', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'req-unknown', honoContext: {} });
  expect(result.refused).toBe(true);
  expect(result.reason).toContain('no declared read/write meta');
  expect(mockCallRequest).not.toHaveBeenCalled();
});

test('runRequest allows a checkWrite: true request type once cli.agentTools.allowWriteRequests is set', async () => {
  fs.writeFileSync(
    path.join(fixtureDir, 'lowdefy.yaml'),
    'lowdefy: 5.0.0\ncli:\n  agentTools:\n    allowWriteRequests: true\n'
  );
  mockCallRequest.mockResolvedValueOnce({
    id: 'req-write',
    success: true,
    type: 'WriteRequest',
    response: { updated: true },
  });
  try {
    const result = await runRequest({ pageId: 'home', requestId: 'req-write', honoContext: {} });
    expect(result.refused).toBe(false);
    expect(result.response).toEqual({ updated: true });
    expect(mockCallRequest).toHaveBeenCalledTimes(1);
  } finally {
    fs.writeFileSync(path.join(fixtureDir, 'lowdefy.yaml'), 'lowdefy: 5.0.0\n');
  }
});

test('runRequest returns a structured error instead of throwing when callRequest fails', async () => {
  mockCallRequest.mockRejectedValueOnce(new Error('boom'));
  const result = await runRequest({ pageId: 'home', requestId: 'req-read', honoContext: {} });
  expect(result.refused).toBe(false);
  expect(result.error).toEqual({ name: 'Error', message: 'boom', source: null, configKey: null });
});

test('runRequest truncates responses larger than the size cap', async () => {
  mockCallRequest.mockResolvedValueOnce({
    id: 'req-read',
    success: true,
    type: 'ReadOnlyRequest',
    response: 'x'.repeat(200_000),
  });
  const result = await runRequest({ pageId: 'home', requestId: 'req-read', honoContext: {} });
  expect(result.truncated).toBe(true);
  expect(result.note).toContain('truncated');
  expect(result.response.length).toEqual(100_000);
});

test('getAppMap includes built page detail and a note for unbuilt pages', () => {
  const map = getAppMap();

  const home = map.pages.find((page) => page.pageId === 'home');
  expect(home.built).toBe(true);
  expect(home.file).toEqual('pages/home.yaml');
  expect(home.blockCount).toEqual(3);
  expect(home.blockTypes).toEqual(['Button', 'Card']);
  expect(home.requests).toEqual([
    { id: 'req-read', type: 'ReadOnlyRequest' },
    { id: 'req-write', type: 'WriteRequest' },
    { id: 'req-unknown', type: 'UnknownMetaRequest' },
    { id: 'get_answers', type: 'MongoDBFind' },
    { id: 'answers_report', type: 'MongoDBAggregation' },
    { id: 'req-orphan', type: 'MongoDBFind' },
    { id: 'req-dynamic', type: 'MongoDBFind' },
    { id: 'req-ghost', type: 'MongoDBFind' },
  ]);

  const unbuilt = map.pages.find((page) => page.pageId === 'unbuilt');
  expect(unbuilt.built).toBe(false);
  expect(unbuilt.blockCount).toBeUndefined();
  expect(map.note).toContain('1 page(s) have not been built');
});

test('getAppMap includes connections, endpoints, agents, menus and websockets', () => {
  const map = getAppMap();
  expect(map.connections).toEqual([
    { id: 'axios', type: 'AxiosHttp' },
    { id: 'answers_rw', type: 'MongoDBCollection' },
    { id: 'answers_ro', type: 'MongoDBCollection' },
    { id: 'evidence', type: 'MongoDBCollection' },
    { id: 'audit_log', type: 'MongoDBCollection' },
    { id: 'audit_log_scoped', type: 'MongoDBCollection' },
    { id: 'dynamic_collection', type: 'MongoDBCollection' },
  ]);
  expect(map.endpoints).toEqual([
    { id: 'resolve_greeting', type: 'InternalApi' },
    { id: 'submit_answer', type: 'Api' },
  ]);
  expect(map.agents).toEqual([{ id: 'assistant', type: 'OpenAiAgent' }]);
  expect(map.websockets).toEqual(['answers_stream', 'chat']);
  expect(map.menus).toEqual([
    {
      menuId: 'default',
      links: [{ menuItemId: 'home', type: 'MenuLink', pageId: 'home', title: 'Home' }],
    },
  ]);
});

test('GET /lowdefy-docs/data-model serves the same object as getDataModel', () => {
  let body;
  docsDataModelHandler({
    json: (data) => {
      body = data;
      return data;
    },
  });
  expect(body).toEqual(getDataModel());
  expect(body.collections.answers.declared).toBe(true);
  expect(body.collections.answers.writers.map((writer) => writer.stepId)).toEqual(['insert']);
  expect(Array.isArray(body.unresolved)).toBe(true);
});

test('seedFixture is refused with howToEnable while cli.agentTools.allowWriteRequests is absent', async () => {
  fs.mkdirSync(path.join(fixtureDir, 'fixtures'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureDir, 'fixtures', 'base.yaml'),
    "axios:\n  - { _id: c1, created_at: { '~d': '2026-01-01T00:00:00.000Z' } }\n"
  );
  const result = await seedFixture({ name: 'base', honoContext: {} });
  expect(result.refused).toBe(true);
  expect(result.reason).toEqual('Seeding writes to the dev database.');
  expect(result.howToEnable).toEqual(
    'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).'
  );
  expect(mockCallConnectionRequest).not.toHaveBeenCalled();
});

test('seedFixture seeds through the connection layer once cli.agentTools.allowWriteRequests is set', async () => {
  fs.writeFileSync(
    path.join(fixtureDir, 'lowdefy.yaml'),
    'lowdefy: 5.0.0\ncli:\n  agentTools:\n    allowWriteRequests: true\n'
  );
  mockCallConnectionRequest.mockResolvedValue({ response: { insertedCount: 1 } });
  try {
    const result = await seedFixture({ name: 'base', honoContext: {} });
    expect(result.refused).toBe(false);
    expect(result.seeded).toEqual([
      { connectionId: 'axios', collection: null, deleted: 0, inserted: 1 },
    ]);
    expect(mockCallConnectionRequest).toHaveBeenCalledTimes(1);
    const [, params] = mockCallConnectionRequest.mock.calls[0];
    expect(params.type).toEqual('MongoDBInsertMany');
    expect(params.tenant).toBeNull();
    expect(params.properties.docs[0].created_at).toBeInstanceOf(Date);
  } finally {
    fs.writeFileSync(path.join(fixtureDir, 'lowdefy.yaml'), 'lowdefy: 5.0.0\n');
  }
});

test('seedFixture returns a missing fixture as data once writes are allowed', async () => {
  fs.writeFileSync(
    path.join(fixtureDir, 'lowdefy.yaml'),
    'lowdefy: 5.0.0\ncli:\n  agentTools:\n    allowWriteRequests: true\n'
  );
  try {
    const result = await seedFixture({ name: 'nope', honoContext: {} });
    expect(result).toEqual({
      refused: false,
      error: {
        name: 'ConfigError',
        message: 'Fixture "nope" not found. Expected fixtures/nope.yaml. Declared fixtures: base.',
      },
    });
  } finally {
    fs.writeFileSync(path.join(fixtureDir, 'lowdefy.yaml'), 'lowdefy: 5.0.0\n');
  }
});
