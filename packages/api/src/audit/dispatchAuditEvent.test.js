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

import dispatchAuditEvent from './dispatchAuditEvent.js';

const sampleEvent = {
  id: 'evt_xyz',
  timestamp: '2026-05-03T10:30:00.000Z',
  category: 'request',
  eventType: 'request.execute',
};

test('dispatchAuditEvent writes to logger.info when transport is stdout', async () => {
  const info = jest.fn();
  await dispatchAuditEvent({
    context: { logger: { info } },
    auditConfig: { transport: 'stdout' },
    events: [sampleEvent],
    requestProperties: undefined,
  });
  expect(info).toHaveBeenCalledTimes(1);
  expect(info.mock.calls[0][0]).toEqual({
    event: 'audit_event',
    auditEvent: sampleEvent,
  });
});

test('dispatchAuditEvent writes each event individually for stdout', async () => {
  const info = jest.fn();
  const evt2 = { ...sampleEvent, id: 'evt_2' };
  await dispatchAuditEvent({
    context: { logger: { info } },
    auditConfig: { transport: 'stdout' },
    events: [sampleEvent, evt2],
    requestProperties: undefined,
  });
  expect(info).toHaveBeenCalledTimes(2);
});

test('dispatchAuditEvent calls connection resolver for connection transport', async () => {
  const resolver = jest.fn().mockResolvedValue('ok');
  const readConfigFile = jest.fn().mockResolvedValue({
    connectionId: 'audit_db',
    type: 'MongoDBCollection',
    properties: { databaseUri: 'mongodb://test', collection: 'audit' },
  });
  const connections = {
    MongoDBCollection: { requests: { MongoDBInsertMany: resolver } },
  };
  await dispatchAuditEvent({
    context: { readConfigFile, connections, logger: { info: jest.fn() } },
    auditConfig: {
      transport: 'connection',
      connectionId: 'audit_db',
      requestType: 'MongoDBInsertMany',
    },
    events: [sampleEvent],
    requestProperties: { docs: [sampleEvent] },
  });
  expect(resolver).toHaveBeenCalledTimes(1);
  expect(resolver.mock.calls[0][0]).toMatchObject({
    connectionId: 'audit_db',
    request: { docs: [sampleEvent] },
  });
});

test('dispatchAuditEvent throws when connection config is missing', async () => {
  await expect(
    dispatchAuditEvent({
      context: { readConfigFile: jest.fn().mockResolvedValue(null), connections: {} },
      auditConfig: {
        transport: 'connection',
        connectionId: 'missing',
        requestType: 'MongoDBInsertMany',
      },
      events: [sampleEvent],
      requestProperties: {},
    })
  ).rejects.toThrow('config not found at runtime');
});

test('dispatchAuditEvent does nothing when events array is empty', async () => {
  const info = jest.fn();
  const result = await dispatchAuditEvent({
    context: { logger: { info } },
    auditConfig: { transport: 'stdout' },
    events: [],
    requestProperties: undefined,
  });
  expect(result).toBeUndefined();
  expect(info).not.toHaveBeenCalled();
});
