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

import addFailGate from './addFailGate.js';
import addPauseGate from './addPauseGate.js';
import createSessionConnections from './createSessionConnections.js';
import listUnfiredFailGates from './listUnfiredFailGates.js';
import releasePauseGates from './releasePauseGates.js';

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

let session;
beforeEach(() => {
  vi.clearAllMocks();
  session = { name: 'billing', sunk: [], stubs: [], failGates: [], pauseGates: [] };
});

function build() {
  return createSessionConnections({ connections, context, session });
}

function stub(entry) {
  session.stubs.push(entry);
}

test('createSessionConnections sinks an external type and leaves the gate reading each type as declared', async () => {
  const { gate, resolvers } = build();
  expect(gate.SMTP.meta.dataSet).toEqual('external');
  expect(gate.MongoDBCollection.meta.dataSet).toEqual('redirect');
  expect(gate.Sql.meta).toBeUndefined();
  expect(gate.Mcp).toBe(connections.Mcp);
  expect(await resolvers.SMTP.requests.SMTPMailSend({ ...args, connectionId: 'mail' })).toBeNull();
  expect(send).not.toHaveBeenCalled();
  expect(session.sunk).toHaveLength(1);
  expect(session.sunk[0].connectionId).toEqual('mail');
  expect(await resolvers.MongoDBCollection.requests.MongoDBFind(args)).toEqual(['row']);
  expect(find).toHaveBeenCalledWith(args);
});

test('createSessionConnections answers a stubbed request from its stub and records it, without the connection properties', async () => {
  const answer = vi.fn(async (request) => ({ messageId: `m-${request.requestId}` }));
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', fn: answer });
  const { resolvers } = build();
  const response = await resolvers.SMTP.requests.SMTPMailSend(args);
  expect(response).toEqual({ messageId: 'm-load_report' });
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
  expect(answer).toHaveBeenCalledWith(record);
  expect(session.sunk).toEqual([record]);
});

test('createSessionConnections keeps the schema and meta of the real resolver on a stubbed one', () => {
  stub({ connectionType: 'Sql', requestType: 'SqlQuery', fn: async () => [] });
  const { resolvers } = build();
  expect(resolvers.Sql.requests.SqlQuery.schema).toBe(query.schema);
  expect(resolvers.Sql.requests.SqlQuery.meta).toBe(query.meta);
  expect(resolvers.Sql.requests.SqlExecute.meta).toBe(execute.meta);
  expect(resolvers.SMTP.requests.SMTPMailSend.schema).toBe(send.schema);
});

test('createSessionConnections leaves a type that declares nothing to the gate when none of its requests is stubbed', async () => {
  const { gate, resolvers } = build();
  expect(gate.Sql).toBe(connections.Sql);
  // The gate refuses the connection before a resolver is reached; the map holds the real one.
  expect(await resolvers.Sql.requests.SqlQuery(args)).toEqual(['real row']);
});

test('createSessionConnections lets a stubbed request type of an undeclared type through and refuses its other request types, naming the connection', async () => {
  stub({ connectionType: 'Sql', requestType: 'SqlQuery', fn: async () => [{ total: 3 }] });
  const { gate, resolvers } = build();
  expect(gate.Sql.meta.dataSet).toEqual('external');
  expect(await resolvers.Sql.requests.SqlQuery(args)).toEqual([{ total: 3 }]);
  expect(query).not.toHaveBeenCalled();
  await expect(resolvers.Sql.requests.SqlExecute(args)).rejects.toThrow(
    'Connection "reports" (type Sql) cannot run under data set "billing": its type does not say how to redirect it, and request type "SqlExecute" has no stub.'
  );
  expect(execute).not.toHaveBeenCalled();
});

test("createSessionConnections never changes the app's own plugin map", () => {
  stub({ connectionType: 'Sql', requestType: 'SqlQuery', fn: async () => [] });
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', fn: async () => null });
  build();
  expect(connections.Sql.meta).toBeUndefined();
  expect(connections.Sql.requests.SqlQuery).toBe(query);
  expect(connections.SMTP.requests.SMTPMailSend).toBe(send);
});

test('createSessionConnections fails a stubbed request with what its stub throws', async () => {
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    fn: () => {
      throw new Error('Mailbox full');
    },
  });
  const { resolvers } = build();
  await expect(resolvers.SMTP.requests.SMTPMailSend(args)).rejects.toThrow('Mailbox full');
});

async function isSettled(promise) {
  const pending = Symbol('pending');
  const winner = await Promise.race([
    promise,
    new Promise((resolve) => setImmediate(resolve, pending)),
  ]);
  return winner !== pending;
}

test('createSessionConnections answers from the first stub that matches, in the order the stubs were set', async () => {
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', answer: { messageId: 'first' } });
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', answer: { messageId: 'second' } });
  const { resolvers } = build();
  expect(await resolvers.SMTP.requests.SMTPMailSend(args)).toEqual({ messageId: 'first' });
  expect(session.sunk).toHaveLength(1);
});

test('createSessionConnections answers a literal answer as a copy, so a routine that changes it leaves the stub as written', async () => {
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', answer: { messageId: 'm-1' } });
  const { resolvers } = build();
  const response = await resolvers.SMTP.requests.SMTPMailSend(args);
  response.messageId = 'changed';
  expect(session.stubs[0].answer).toEqual({ messageId: 'm-1' });
});

test('createSessionConnections matches a stub on part of the request, so one connection type answers different requests differently', async () => {
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    match: { to: 'billing@example.test' },
    answer: 'billing',
  });
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    match: { sql: 'select 1' },
    answer: 'report',
  });
  const { resolvers } = build();
  expect(
    await resolvers.SMTP.requests.SMTPMailSend({
      ...args,
      request: { to: 'billing@example.test', subject: 'Run approved' },
    })
  ).toEqual('billing');
  // The request carries more than the match names, and the match reads the scrubbed request.
  expect(await resolvers.SMTP.requests.SMTPMailSend(args)).toEqual('report');
  expect(session.sunk.map((record) => record.request)).toEqual([
    { to: 'billing@example.test', subject: 'Run approved' },
    { sql: 'select 1', token: '[REDACTED]' },
  ]);
});

test('createSessionConnections sinks a request no stub matches on an external type: it answers null and is recorded once', async () => {
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    match: { to: 'billing@example.test' },
    answer: 'billing',
  });
  const { resolvers } = build();
  expect(await resolvers.SMTP.requests.SMTPMailSend(args)).toBeNull();
  expect(send).not.toHaveBeenCalled();
  expect(session.sunk).toHaveLength(1);
});

test('createSessionConnections narrows a stub by request id, endpoint and page', async () => {
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    requestId: 'load_report',
    endpoint: 'monthly',
    answer: 'monthly endpoint',
  });
  stub({
    connectionType: 'SMTP',
    requestType: 'SMTPMailSend',
    requestId: 'load_report',
    pageId: 'reports',
    answer: 'reports page',
  });
  const { resolvers } = build();
  const { SMTPMailSend } = resolvers.SMTP.requests;
  expect(await SMTPMailSend(args)).toEqual('monthly endpoint');
  expect(await SMTPMailSend({ ...args, endpointId: undefined, pageId: 'reports' })).toEqual(
    'reports page'
  );
  expect(await SMTPMailSend({ ...args, endpointId: 'weekly' })).toBeNull();
  expect(await SMTPMailSend({ ...args, requestId: 'other' })).toBeNull();
});

test('createSessionConnections opens only the stubbed request type of an undeclared type, and sinks a request of it no stub matches', async () => {
  stub({
    connectionType: 'Sql',
    requestType: 'SqlQuery',
    requestId: 'load_report',
    answer: [{ total: 3 }],
  });
  const { gate, resolvers } = build();
  expect(gate.Sql.meta.dataSet).toEqual('external');
  expect(await resolvers.Sql.requests.SqlQuery(args)).toEqual([{ total: 3 }]);
  expect(await resolvers.Sql.requests.SqlQuery({ ...args, requestId: 'other' })).toBeNull();
  expect(query).not.toHaveBeenCalled();
  expect(session.sunk.map((record) => record.requestId)).toEqual(['load_report', 'other']);
  await expect(resolvers.Sql.requests.SqlExecute(args)).rejects.toThrow(
    'request type "SqlExecute" has no stub'
  );
  expect(execute).not.toHaveBeenCalled();
});

test('createSessionConnections fails a request at a fail gate before its resolver runs, with a forced ServiceError carrying the message', async () => {
  addFailGate({ session, requestId: 'load_report', message: 'Write failed on purpose' });
  const { resolvers } = build();
  const error = await resolvers.MongoDBCollection.requests
    .MongoDBFind(args)
    .catch((caught) => caught);
  expect(error.name).toEqual('ServiceError');
  expect(error.message).toEqual('Write failed on purpose');
  expect(error.forced).toBe(true);
  expect(error.isLowdefyError).toBe(true);
  expect(find).not.toHaveBeenCalled();
});

test('createSessionConnections fires a fail gate once by default, so the next request runs for real', async () => {
  addFailGate({ session, requestId: 'load_report', message: 'Down' });
  const { resolvers } = build();
  await expect(resolvers.MongoDBCollection.requests.MongoDBFind(args)).rejects.toThrow('Down');
  expect(await resolvers.MongoDBCollection.requests.MongoDBFind(args)).toEqual(['row']);
  expect(session.failGates[0].fired).toEqual(1);
});

test('createSessionConnections fires a fail gate with times n on the next n matching requests', async () => {
  addFailGate({ session, requestId: 'load_report', message: 'Down', times: 2 });
  const { resolvers } = build();
  const { MongoDBFind } = resolvers.MongoDBCollection.requests;
  await expect(MongoDBFind(args)).rejects.toThrow('Down');
  await expect(MongoDBFind(args)).rejects.toThrow('Down');
  expect(await MongoDBFind(args)).toEqual(['row']);
  expect(find).toHaveBeenCalledTimes(1);
});

test('createSessionConnections fires a fail gate with times all on every matching request, on every connection type', async () => {
  addFailGate({ session, requestId: 'load_report', message: 'Down', times: 'all' });
  const { resolvers } = build();
  for (let call = 0; call < 5; call += 1) {
    await expect(resolvers.MongoDBCollection.requests.MongoDBFind(args)).rejects.toThrow('Down');
  }
  await expect(resolvers.SMTP.requests.SMTPMailSend(args)).rejects.toThrow('Down');
  expect(session.failGates[0].fired).toEqual(6);
  expect(find).not.toHaveBeenCalled();
  expect(session.sunk).toEqual([]);
});

test('createSessionConnections fails a stubbed request at a fail gate before its stub answers', async () => {
  const answer = vi.fn(() => 'answered');
  stub({ connectionType: 'SMTP', requestType: 'SMTPMailSend', fn: answer });
  addFailGate({ session, requestId: 'load_report', message: 'Down' });
  const { resolvers } = build();
  await expect(resolvers.SMTP.requests.SMTPMailSend(args)).rejects.toThrow('Down');
  expect(answer).not.toHaveBeenCalled();
  expect(session.sunk).toEqual([]);
});

test('createSessionConnections narrows a fail gate by endpoint and page, and the session reports the gate that never fired', async () => {
  addFailGate({ session, requestId: 'load_report', endpoint: 'weekly', message: 'Weekly down' });
  addFailGate({ session, requestId: 'load_report', endpoint: 'monthly', message: 'Monthly down' });
  addFailGate({ session, requestId: 'load_report', pageId: 'reports', message: 'Page down' });
  const { resolvers } = build();
  const { MongoDBFind } = resolvers.MongoDBCollection.requests;
  await expect(MongoDBFind(args)).rejects.toThrow('Monthly down');
  await expect(MongoDBFind({ ...args, endpointId: undefined, pageId: 'reports' })).rejects.toThrow(
    'Page down'
  );
  expect(listUnfiredFailGates({ session })).toEqual([
    {
      requestId: 'load_report',
      endpoint: 'weekly',
      pageId: undefined,
      message: 'Weekly down',
      times: 1,
      fired: 0,
    },
  ]);
});

test('createSessionConnections holds a routine at a pause gate narrowed by endpoint and page, and records that it was reached', async () => {
  const weekly = addPauseGate({ session, requestId: 'load_report', endpoint: 'weekly' });
  const page = addPauseGate({ session, requestId: 'load_report', pageId: 'reports' });
  const { resolvers } = build();
  const { MongoDBFind } = resolvers.MongoDBCollection.requests;
  // The monthly endpoint's request matches neither gate and runs straight through.
  expect(await MongoDBFind(args)).toEqual(['row']);
  const held = MongoDBFind({ ...args, endpointId: undefined, pageId: 'reports' });
  await page.reached;
  expect(await isSettled(held)).toBe(false);
  expect(session.pauseGates.map((gate) => gate.reached)).toEqual([false, true]);
  expect(find).toHaveBeenCalledTimes(1);
  page.release();
  expect(await held).toEqual(['row']);
  expect(await isSettled(weekly.reached)).toBe(false);
  releasePauseGates({ session });
  expect(session.pauseGates).toEqual([]);
});

test('createSessionConnections holds a routine at a pause gate before a fail gate on the same request throws', async () => {
  const gate = addPauseGate({ session, requestId: 'load_report' });
  addFailGate({ session, requestId: 'load_report', message: 'Down' });
  const { resolvers } = build();
  const held = resolvers.MongoDBCollection.requests.MongoDBFind(args).catch((error) => error);
  await gate.reached;
  expect(session.failGates[0].fired).toEqual(0);
  gate.release();
  expect((await held).message).toEqual('Down');
});
