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

import buildAudit from './buildAudit.js';

function makeContext({ connectionIds = new Set(['audit_db']) } = {}) {
  return {
    connectionIds,
    errors: [],
    keyMap: {},
  };
}

function validAudit(overrides = {}) {
  const audit = {
    connectionId: 'audit_db',
    events: ['request', 'authorization'],
    requestType: 'MongoDBInsertMany',
    ...overrides,
  };
  Object.defineProperty(audit, '~k', { value: 'audit', enumerable: false });
  return audit;
}

function validConnections() {
  return [{ connectionId: 'audit_db', type: 'MongoDBCollection' }];
}

test('buildAudit leaves components.audit undefined when not configured', () => {
  const components = {};
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.audit).toBeUndefined();
  expect(context.errors).toHaveLength(0);
});

test('buildAudit fills default severity, strict, mask, fields, capture, transport, batch', () => {
  const components = {
    audit: validAudit(),
    connections: validConnections(),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.audit.severity).toBe('medium');
  expect(components.audit.strict).toBe(false);
  expect(components.audit.mask).toEqual([]);
  expect(components.audit.fields).toEqual({});
  expect(components.audit.capture).toEqual({});
  expect(components.audit.transport).toBe('connection');
  expect(components.audit.batch).toEqual({ enabled: false });
  expect(components.audit.configured).toBe(true);
  expect(context.errors).toHaveLength(0);
});

test('buildAudit fills batch defaults when batch is partially configured', () => {
  const audit = {
    connectionId: 'audit_db',
    events: ['request'],
    requestType: 'MongoDBInsertMany',
    batch: { enabled: true },
  };
  Object.defineProperty(audit, '~k', { value: 'audit', enumerable: false });
  Object.defineProperty(audit.batch, '~k', { value: 'audit-batch', enumerable: false });
  const components = { audit, connections: validConnections() };
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.audit.batch.enabled).toBe(true);
  expect(components.audit.batch.size).toBe(100);
  expect(components.audit.batch.interval).toBe(5000);
});

test('buildAudit accepts stdout transport without connectionId', () => {
  const audit = { transport: 'stdout', events: ['request'] };
  Object.defineProperty(audit, '~k', { value: 'audit', enumerable: false });
  const components = { audit };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(0);
  expect(components.audit.transport).toBe('stdout');
  expect(components.audit.configured).toBe(true);
});

test('buildAudit collects error when transport is connection but connectionId is missing', () => {
  const audit = {
    transport: 'connection',
    events: ['request'],
    requestType: 'MongoDBInsertMany',
  };
  Object.defineProperty(audit, '~k', { value: 'audit', enumerable: false });
  const components = { audit, connections: validConnections() };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/connectionId.*required.*connection/);
});

test('buildAudit collects error when connectionId references unknown connection', () => {
  const components = {
    audit: validAudit({ connectionId: 'missing_db' }),
    connections: validConnections(),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/unknown connection/);
});

test('buildAudit collects error when connection type is unsupported', () => {
  const components = {
    audit: validAudit(),
    connections: [{ connectionId: 'audit_db', type: 'Knex' }],
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/unsupported type/);
});

test('buildAudit collects error when MongoDBCollection is paired with wrong requestType', () => {
  const components = {
    audit: validAudit({ requestType: 'AwsS3PutObject' }),
    connections: validConnections(),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/incompatible/);
});

test('buildAudit accepts AwsS3Bucket paired with AwsS3PutObject', () => {
  const components = {
    audit: validAudit({ requestType: 'AwsS3PutObject' }),
    connections: [{ connectionId: 'audit_db', type: 'AwsS3Bucket' }],
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(0);
  expect(components.audit.requestType).toBe('AwsS3PutObject');
});

test('buildAudit collects error when both exclude and include are set', () => {
  const components = {
    audit: validAudit({
      exclude: { requests: ['x'] },
      include: { requests: ['y'] },
    }),
    connections: validConnections(),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/cannot have both/);
});

test('buildAudit collects error when events list is missing', () => {
  const audit = { connectionId: 'audit_db', requestType: 'MongoDBInsertMany' };
  Object.defineProperty(audit, '~k', { value: 'audit', enumerable: false });
  const components = {
    audit,
    connections: validConnections(),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors.length).toBeGreaterThanOrEqual(1);
});
