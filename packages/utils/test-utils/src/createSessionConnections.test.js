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

import { beforeEach, expect, test, vi } from 'vitest';

import createSessionConnections from './createSessionConnections.js';

const send = vi.fn(async () => ({ sent: true }));
send.schema = { type: 'object' };
send.meta = { checkRead: false, checkWrite: true };
const find = vi.fn(async () => ['row']);
find.meta = { checkRead: true, checkWrite: false };
const query = vi.fn(async () => ['real row']);
query.schema = { type: 'object', required: ['sql'] };
query.meta = { checkRead: true, checkWrite: false };
const execute = vi.fn(async () => ({ changed: 1 }));
execute.meta = { checkRead: false, checkWrite: true };

const connections = {
  SMTP: { schema: {}, meta: { dataSet: 'external' }, requests: { SMTPMailSend: send } },
  MongoDBCollection: { meta: { dataSet: 'redirect' }, requests: { MongoDBFind: find } },
  // Declares nothing, as Knex, Redis and Elasticsearch do.
  Sql: { schema: {}, requests: { SqlQuery: query, SqlExecute: execute } },
  Mcp: { meta: { dataSet: 'external' } },
};
const context = { scrubSecrets: (value) => value.replace('s3cret', '[REDACTED]') };
const args = {
  connection: { password: 's3cret' },
  connectionId: 'reports',
  endpointId: 'monthly',
  request: { sql: 'select 1', token: 's3cret' },
  requestId: 'load_report',
};

let testSession;
beforeEach(() => {
  vi.clearAllMocks();
  const session = { name: 'billing', sunk: [] };
  testSession = {
    dataSession: { session, sunk: session.sunk },
    gates: new Map(),
    held: new Set(),
    runtime: { connections },
    stubs: new Map(),
  };
});

test('createSessionConnections sinks an external type and leaves the gate reading each type as declared', async () => {
  const { gate, resolvers } = createSessionConnections({ context, testSession });
  expect(gate.SMTP.meta.dataSet).toEqual('external');
  expect(gate.MongoDBCollection.meta.dataSet).toEqual('redirect');
  expect(gate.Sql.meta).toBeUndefined();
  expect(gate.Mcp).toBe(connections.Mcp);
  expect(await resolvers.SMTP.requests.SMTPMailSend({ ...args, connectionId: 'mail' })).toBeNull();
  expect(send).not.toHaveBeenCalled();
  expect(testSession.dataSession.sunk).toHaveLength(1);
  expect(testSession.dataSession.sunk[0].connectionId).toEqual('mail');
  expect(await resolvers.MongoDBCollection.requests.MongoDBFind(args)).toEqual(['row']);
  expect(find).toHaveBeenCalledWith(args);
});

test('createSessionConnections answers a stubbed request from its stub and records it, without the connection properties', async () => {
  const stub = vi.fn(async (request) => ({ messageId: `m-${request.requestId}` }));
  testSession.stubs.set('SMTP', new Map([['SMTPMailSend', stub]]));
  const { resolvers } = createSessionConnections({ context, testSession });
  const answer = await resolvers.SMTP.requests.SMTPMailSend(args);
  expect(answer).toEqual({ messageId: 'm-load_report' });
  expect(send).not.toHaveBeenCalled();
  const record = {
    connectionId: 'reports',
    connectionType: 'SMTP',
    requestId: 'load_report',
    pageId: null,
    endpointId: 'monthly',
    request: { sql: 'select 1', token: '[REDACTED]' },
    requestType: 'SMTPMailSend',
  };
  expect(stub).toHaveBeenCalledWith(record);
  expect(testSession.dataSession.sunk).toEqual([record]);
});

test('createSessionConnections keeps the schema and meta of the real resolver on a stubbed one', () => {
  testSession.stubs.set('Sql', new Map([['SqlQuery', async () => []]]));
  const { resolvers } = createSessionConnections({ context, testSession });
  expect(resolvers.Sql.requests.SqlQuery.schema).toBe(query.schema);
  expect(resolvers.Sql.requests.SqlQuery.meta).toBe(query.meta);
  expect(resolvers.Sql.requests.SqlExecute.meta).toBe(execute.meta);
  expect(resolvers.SMTP.requests.SMTPMailSend.schema).toBe(send.schema);
});

test('createSessionConnections leaves a type that declares nothing to the gate when none of its requests is stubbed', async () => {
  const { gate, resolvers } = createSessionConnections({ context, testSession });
  expect(gate.Sql).toBe(connections.Sql);
  // The gate refuses the connection before a resolver is reached; the map holds the real one.
  expect(await resolvers.Sql.requests.SqlQuery(args)).toEqual(['real row']);
});

test('createSessionConnections lets a stubbed request type of an undeclared type through and refuses its other request types, naming the connection', async () => {
  testSession.stubs.set('Sql', new Map([['SqlQuery', async () => [{ total: 3 }]]]));
  const { gate, resolvers } = createSessionConnections({ context, testSession });
  expect(gate.Sql.meta.dataSet).toEqual('external');
  expect(await resolvers.Sql.requests.SqlQuery(args)).toEqual([{ total: 3 }]);
  expect(query).not.toHaveBeenCalled();
  await expect(resolvers.Sql.requests.SqlExecute(args)).rejects.toThrow(
    'Connection "reports" (type Sql) cannot run under data set "billing": its type does not say how to redirect it, and request type "SqlExecute" has no stub.'
  );
  expect(execute).not.toHaveBeenCalled();
});

test("createSessionConnections never changes the app's own plugin map", () => {
  testSession.stubs.set('Sql', new Map([['SqlQuery', async () => []]]));
  testSession.stubs.set('SMTP', new Map([['SMTPMailSend', async () => null]]));
  createSessionConnections({ context, testSession });
  expect(connections.Sql.meta).toBeUndefined();
  expect(connections.Sql.requests.SqlQuery).toBe(query);
  expect(connections.SMTP.requests.SMTPMailSend).toBe(send);
});

test('createSessionConnections fails a stubbed request with what its stub throws', async () => {
  testSession.stubs.set(
    'SMTP',
    new Map([
      [
        'SMTPMailSend',
        () => {
          throw new Error('Mailbox full');
        },
      ],
    ])
  );
  const { resolvers } = createSessionConnections({ context, testSession });
  await expect(resolvers.SMTP.requests.SMTPMailSend(args)).rejects.toThrow('Mailbox full');
});
