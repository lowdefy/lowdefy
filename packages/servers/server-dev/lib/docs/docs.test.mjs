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

import setupTestFixtures from './setupTestFixtures.mjs';

// The docs service reads build artifacts and node_modules from process.cwd()
// (the running server directory) — point it at the fixture server before the
// modules are imported, since resolvePluginDir captures cwd at import time.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

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
const { default: getPageConfig } = await import('./getPageConfig.js');
const { default: readPageArtifact } = await import('./readPageArtifact.js');
const { default: findConfig } = await import('./findConfig.js');

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

test('getBuildStatus returns the build artifact plus reported client errors', () => {
  const result = getBuildStatus();
  expect(result.build.status).toEqual('ok');
  expect(result.clientErrors.length).toEqual(50);
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
  expect(result).toEqual({ kind: 'page', pageId: 'home', file: 'pages/home.yaml' });
});

test('findConfig scans keyMap for a matching id when no pageId is given', async () => {
  const result = await findConfig({ id: 'my_button' });
  expect(result.matches.length).toEqual(1);
  expect(result.matches[0].keyPath).toEqual('root.pages[0:home].blocks[2:my_button:Button]');
  expect(result.matches[0].location.source).toContain('pages/home.yaml:5');
  expect(result.note).toContain('Pass ?pageId=');
});

test('findConfig returns empty matches with a note when nothing matches', async () => {
  const result = await findConfig({ id: 'no-such-id' });
  expect(result.matches).toEqual([]);
  expect(result.note).toBeDefined();
});

test('findConfig throws when id is missing', async () => {
  await expect(findConfig({ id: undefined })).rejects.toThrow('requires an "id" string');
});
