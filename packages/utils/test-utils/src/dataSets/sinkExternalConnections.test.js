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

import { vi, beforeEach, expect, test } from 'vitest';

import sinkExternalConnections from './sinkExternalConnections.js';

const realSend = vi.fn(async () => ({ sent: true }));
realSend.schema = { type: 'object' };
realSend.meta = { checkWrite: true };
const realGather = vi.fn(async () => ({ downloaded: true }));
realGather.schema = { type: 'object' };
realGather.meta = { checkRead: true, dataSet: 'external' };
const realRead = vi.fn(async () => ['doc']);
realRead.meta = { checkRead: true };
const realMongo = vi.fn(async () => ['row']);

const connections = {
  SMTP: { schema: {}, meta: { dataSet: 'external' }, requests: { SMTPMailSend: realSend } },
  MongoDBCollection: { meta: { dataSet: 'redirect' }, requests: { MongoDBFind: realMongo } },
  Mcp: { meta: { dataSet: 'external' } },
  Evidence: { meta: { dataSet: 'walled' }, requests: { Gather: realGather, Read: realRead } },
};
const context = { scrubSecrets: (value) => value.replace('s3cret', '[REDACTED]') };

let session;
beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.LOWDEFY_DEV_SMTP_PORT;
  session = { sunk: [] };
});

function args(overrides = {}) {
  return {
    connection: { host: 'smtp.example.com', port: 587, pass: 's3cret' },
    connectionId: 'notifications-email',
    requestId: 'send',
    pageId: 'review',
    request: { to: 'a@example.com', note: 's3cret' },
    ...overrides,
  };
}

test('an external request is recorded and answers null, and never reaches the real resolver', async () => {
  const map = sinkExternalConnections({ context, connections, session });
  const response = await map.SMTP.requests.SMTPMailSend(args());
  expect(response).toBeNull();
  expect(realSend).not.toHaveBeenCalled();
  expect(session.sunk).toEqual([
    {
      connectionId: 'notifications-email',
      connectionType: 'SMTP',
      requestType: 'SMTPMailSend',
      requestId: 'send',
      pageId: 'review',
      endpointId: null,
      request: { to: 'a@example.com', note: '[REDACTED]' },
    },
  ]);
  // The connection's own properties, which hold its credentials, are never recorded.
  expect(JSON.stringify(session.sunk)).not.toContain('smtp.example.com');
});

test('a sunk resolver keeps the schema and meta of the real one', () => {
  const map = sinkExternalConnections({ context, connections, session });
  expect(map.SMTP.requests.SMTPMailSend.schema).toBe(realSend.schema);
  expect(map.SMTP.requests.SMTPMailSend.meta).toBe(realSend.meta);
});

test('redirect types, types without requests and the plugin map are left alone', () => {
  const map = sinkExternalConnections({ context, connections, session });
  expect(map.MongoDBCollection).toBe(connections.MongoDBCollection);
  expect(map.Mcp).toBe(connections.Mcp);
  expect(connections.SMTP.requests.SMTPMailSend).toBe(realSend);
});

test('an SMTP request to the dev mail capture runs for real, any other host is sunk', async () => {
  process.env.LOWDEFY_DEV_SMTP_PORT = '2525';
  const map = sinkExternalConnections({ context, connections, session });
  const capture = args({ connection: { host: '127.0.0.1', port: 2525 } });
  expect(await map.SMTP.requests.SMTPMailSend(capture)).toEqual({ sent: true });
  expect(realSend).toHaveBeenCalledTimes(1);
  await map.SMTP.requests.SMTPMailSend(args({ connection: { host: '127.0.0.1', port: 587 } }));
  await map.SMTP.requests.SMTPMailSend(
    args({ connection: { host: 'smtp.example.com', port: 2525 } })
  );
  expect(realSend).toHaveBeenCalledTimes(1);
  expect(session.sunk).toHaveLength(2);
});

test('a request type that declares external is sunk on a walled connection, its siblings run for real', async () => {
  const map = sinkExternalConnections({ context, connections, session });
  const response = await map.Evidence.requests.Gather(
    args({ connectionId: 'evidence', requestId: 'gather' })
  );
  expect(response).toBeNull();
  expect(realGather).not.toHaveBeenCalled();
  expect(session.sunk).toEqual([
    {
      connectionId: 'evidence',
      connectionType: 'Evidence',
      requestType: 'Gather',
      requestId: 'gather',
      pageId: 'review',
      endpointId: null,
      request: { to: 'a@example.com', note: '[REDACTED]' },
    },
  ]);
  expect(map.Evidence.requests.Gather.meta).toBe(realGather.meta);
  expect(map.Evidence.meta).toBe(connections.Evidence.meta);
  expect(map.Evidence.requests.Read).toBe(realRead);
  expect(await map.Evidence.requests.Read(args())).toEqual(['doc']);
  expect(session.sunk).toHaveLength(1);
});

test('a connection with no external request type is returned as is, and the plugin map is not mutated', () => {
  const map = sinkExternalConnections({ context, connections, session });
  expect(map.MongoDBCollection).toBe(connections.MongoDBCollection);
  expect(connections.Evidence.requests.Gather).toBe(realGather);
  const plain = { Plain: { meta: { dataSet: 'walled' }, requests: { Read: realRead } } };
  expect(sinkExternalConnections({ context, connections: plain, session }).Plain).toBe(plain.Plain);
});
