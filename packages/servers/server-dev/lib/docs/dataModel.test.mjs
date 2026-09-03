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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import setupTestFixtures from './setupTestFixtures.mjs';

// getDataModel reads build artifacts from process.cwd() — point it at the
// fixture server before the modules are imported.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

const { default: getDataModel } = await import('./getDataModel.js');
const { default: resolveCollectionJoin } = await import('./resolveCollectionJoin.js');
const { default: createDocsMcpServer } = await import('./createDocsMcpServer.js');
const { default: docsDataModelHandler } = await import('../../src/routes/docs/dataModel.js');

const collectionsPath = path.join(fixtureDir, 'build', 'collections.json');
const declaredCollections = fs.readFileSync(collectionsPath, 'utf8');

afterEach(() => {
  fs.writeFileSync(collectionsPath, declaredCollections);
});

test('getDataModel reports a declared collection with its fields, relations, indexes, tenant and connections', () => {
  const model = getDataModel();
  const answers = model.collections.answers;

  expect(answers.declared).toBe(true);
  expect(answers.tenant).toEqual({ field: 'organization_id' });
  expect(answers.fields).toEqual({
    test_id: { type: 'string' },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    superseded: { type: 'boolean' },
  });
  expect(answers.relations).toEqual({ evidence_ids: { collection: 'evidence', field: '_id' } });
  expect(answers.indexes).toEqual([
    { keys: { organization_id: 1, test_id: 1 }, options: { unique: true } },
  ]);
  // read defaults true, write defaults false (MongoDBCollection schema); the
  // connection type comes from the connection artifact, not collections.json.
  expect(answers.connections).toEqual([
    {
      connectionId: 'answers_rw',
      type: 'MongoDBCollection',
      read: true,
      write: true,
      tenant: { field: 'organization_id' },
    },
    {
      connectionId: 'answers_ro',
      type: 'MongoDBCollection',
      read: true,
      write: false,
      tenant: { field: 'organization_id' },
    },
  ]);
  expect(model.note).toBeUndefined();
});

test('getDataModel resolves an undeclared connection tenant through the build tenant index', () => {
  const { connections } = resolveCollectionJoin();
  // answers_ro declares no tenant; under policy: tenant the build resolved it
  // to the default field in tenantCollections.json.
  expect(connections.answers_ro.tenant).toEqual({ field: 'organization_id' });
  expect(connections.answers_rw.tenant).toEqual({ field: 'organization_id' });
  expect(connections.audit_log.tenant).toEqual('shared');
  // A connection that names no collection at all is joined as null, not unresolved.
  expect(connections.axios.collection).toBeNull();
});

test('getDataModel discovers an undeclared collection from its connections alone', () => {
  const model = getDataModel();
  const auditLog = model.collections.audit_log;

  expect(auditLog.declared).toBe(false);
  expect(auditLog.fields).toEqual({});
  expect(auditLog.relations).toEqual({});
  expect(auditLog.indexes).toEqual([]);
  expect(auditLog.connections.map((connection) => connection.connectionId)).toEqual([
    'audit_log',
    'audit_log_scoped',
  ]);
});

test('getDataModel names the disagreeing connections when an undeclared collection has conflicting tenants', () => {
  const model = getDataModel();
  expect(model.collections.audit_log.tenant).toEqual({
    conflict: [
      { connectionId: 'audit_log', tenant: 'shared' },
      { connectionId: 'audit_log_scoped', tenant: { field: 'organization_id' } },
    ],
  });
});

test('getDataModel uses the connections tenant for an undeclared collection when they agree', () => {
  fs.writeFileSync(collectionsPath, '{}');
  const model = getDataModel();
  expect(model.collections.answers.declared).toBe(false);
  expect(model.collections.answers.tenant).toEqual({ field: 'organization_id' });
});

test('getDataModel classifies a page request as a reader by checkRead meta with a resolved source', () => {
  const model = getDataModel();
  expect(model.collections.answers.readers).toContainEqual({
    kind: 'request',
    pageId: 'home',
    requestId: 'get_answers',
    type: 'MongoDBFind',
    connectionId: 'answers_ro',
    via: 'request',
    source: 'pages/home.yaml:42',
  });
});

test('getDataModel classifies a nested routine step as a writer by checkWrite meta with a resolved source', () => {
  const model = getDataModel();
  expect(model.collections.answers.writers).toEqual([
    {
      kind: 'step',
      endpointId: 'submit_answer',
      stepId: 'insert',
      type: 'MongoDBInsertOne',
      connectionId: 'answers_rw',
      via: 'step',
      source: 'api/submit.yaml:12',
    },
  ]);
});

test('getDataModel leaves steps on connections without a collection out of the model', () => {
  const model = getDataModel();
  const allEntries = Object.values(model.collections).flatMap((collection) => [
    ...collection.readers,
    ...collection.writers,
  ]);
  expect(allEntries.find((entry) => entry.stepId === 'notify')).toBeUndefined();
  expect(model.unresolved.find((entry) => entry.stepId === 'notify')).toBeUndefined();
});

test('getDataModel scans a literal pipeline for $lookup, $graphLookup, $unionWith reads and a $merge write', () => {
  const model = getDataModel();
  const aggregation = {
    kind: 'request',
    pageId: 'home',
    requestId: 'answers_report',
    type: 'MongoDBAggregation',
    connectionId: 'answers_rw',
    source: 'pages/home.yaml:50',
  };

  // The aggregation itself is a reader of its own collection.
  expect(model.collections.answers.readers).toContainEqual({ ...aggregation, via: 'request' });
  // $lookup.from
  expect(model.collections.evidence.readers).toContainEqual({ ...aggregation, via: '$lookup' });
  // $graphLookup.from inside the $lookup sub-pipeline — collection discovered
  // from the pipeline alone.
  expect(model.collections.controls.declared).toBe(false);
  expect(model.collections.controls.connections).toEqual([]);
  expect(model.collections.controls.readers).toContainEqual({ ...aggregation, via: '$lookup' });
  // $unionWith as a string, and as { coll } inside a $facet branch.
  expect(model.collections.audit_log.readers).toContainEqual({ ...aggregation, via: '$lookup' });
  expect(model.collections.archive.readers).toContainEqual({ ...aggregation, via: '$lookup' });
  // $merge.into — a write edge, even though the aggregation type is checkWrite: false.
  expect(model.collections.reports.declared).toBe(false);
  expect(model.collections.reports.writers).toEqual([{ ...aggregation, via: '$merge' }]);
  expect(model.collections.reports.readers).toEqual([]);
});

test('getDataModel reports a websocket as a reader of its connection collection', () => {
  const model = getDataModel();
  expect(model.collections.answers.readers).toContainEqual({
    kind: 'websocket',
    websocketId: 'answers_stream',
    type: 'MongoDBChangeStream',
    connectionId: 'answers_ro',
    via: 'websocket',
    source: 'websockets.yaml:3',
  });
  const allEntries = Object.values(model.collections).flatMap((collection) => [
    ...collection.readers,
    ...collection.writers,
  ]);
  expect(allEntries.find((entry) => entry.websocketId === 'chat')).toBeUndefined();
});

test('getDataModel lists what could not be joined under unresolved with a reason', () => {
  const model = getDataModel();

  expect(model.unresolved).toContainEqual({
    kind: 'connection',
    connectionId: 'dynamic_collection',
    reason:
      'connection "dynamic_collection" has an operator-valued "collection" property, so its collection can not be resolved at build',
  });
  expect(model.unresolved).toContainEqual({
    kind: 'request',
    pageId: 'home',
    requestId: 'req-dynamic',
    type: 'MongoDBFind',
    connectionId: 'dynamic_collection',
    reason:
      'request "req-dynamic" on page "home" uses connection "dynamic_collection", which has an operator-valued "collection" property',
  });
  expect(model.unresolved).toContainEqual({
    kind: 'request',
    pageId: 'home',
    requestId: 'req-orphan',
    type: 'MongoDBFind',
    connectionId: null,
    reason: 'request "req-orphan" on page "home" has no connectionId',
  });
  expect(model.unresolved).toContainEqual({
    kind: 'request',
    pageId: 'home',
    requestId: 'req-ghost',
    type: 'MongoDBFind',
    connectionId: 'ghost_db',
    reason: 'connection "ghost_db" was not found',
  });
  // Nothing unresolved ever also appears as an edge.
  const allEntries = Object.values(model.collections).flatMap((collection) => [
    ...collection.readers,
    ...collection.writers,
  ]);
  expect(allEntries.find((entry) => entry.requestId === 'req-orphan')).toBeUndefined();
  expect(allEntries.find((entry) => entry.requestId === 'req-dynamic')).toBeUndefined();
  expect(allEntries.find((entry) => entry.requestId === 'req-ghost')).toBeUndefined();
});

test('getDataModel names unbuilt pages whose requests it could not read', () => {
  const model = getDataModel();
  expect(model.unbuiltPages).toEqual(['unbuilt']);
});

test('getDataModel adds the note only when no collections are declared', () => {
  expect(getDataModel().note).toBeUndefined();

  fs.writeFileSync(collectionsPath, '{}');
  const model = getDataModel();
  expect(model.note).toContain('No collections: declared in lowdefy.yaml');
  expect(model.note).toContain('/lowdefy-docs/content/concepts/collections');
  // Connections, readers and writers are still reported.
  expect(model.collections.answers.declared).toBe(false);
  expect(model.collections.answers.connections.length).toEqual(2);
  expect(model.collections.answers.writers.length).toEqual(1);
});

test('getDataModel works when collections.json is missing', () => {
  fs.rmSync(collectionsPath);
  const model = getDataModel();
  expect(model.note).toContain('No collections: declared');
  expect(Object.keys(model.collections)).toContain('answers');
});

test('GET /lowdefy-docs/data-model and the lowdefy_data_model MCP tool return the same object', async () => {
  const server = createDocsMcpServer({ origin: 'http://localhost:3240' });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const tools = await client.listTools();
  const tool = tools.tools.find((entry) => entry.name === 'lowdefy_data_model');
  expect(tool).toBeDefined();
  expect(tool.description).toContain('checkRead/checkWrite');

  const mcpResult = await client.callTool({ name: 'lowdefy_data_model', arguments: {} });
  const fromMcp = JSON.parse(mcpResult.content[0].text);

  let fromRest;
  await docsDataModelHandler({
    json: (data) => {
      fromRest = data;
      return data;
    },
  });

  expect(fromRest).toEqual(getDataModel());
  expect(fromMcp).toEqual(fromRest);
  expect(fromRest.collections.answers.declared).toBe(true);

  await client.close();
});
