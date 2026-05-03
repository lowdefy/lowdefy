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

jest.unstable_mockModule('./dispatchAuditEvent.js', () => ({
  default: jest.fn(),
}));

const { default: createAuditLogger } = await import('./createAuditLogger.js');
const { default: dispatchAuditEvent } = await import('./dispatchAuditEvent.js');

const baseAuditConfig = {
  connectionId: 'audit_db',
  configured: true,
  events: ['request', 'authorization', 'auth', 'error'],
  severity: 'medium',
  requestType: 'MongoDBInsertMany',
  strict: false,
  capture: {},
  fields: {},
  mask: [],
};

const noopLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  dispatchAuditEvent.mockReset();
});

test('createAuditLogger returns no-op when auditConfig is undefined', () => {
  const logger = createAuditLogger({ auditConfig: undefined, context: {} });
  expect(logger.enabled).toBe(false);
  expect(logger.log({ category: 'request' })).toBeUndefined();
});

test('createAuditLogger returns no-op when connectionId is missing', () => {
  const logger = createAuditLogger({ auditConfig: {}, context: {} });
  expect(logger.enabled).toBe(false);
});

test('createAuditLogger returns no-op when context flagged as audit (recursion guard)', () => {
  const logger = createAuditLogger({
    auditConfig: baseAuditConfig,
    context: { __audit: true, logger: noopLogger },
  });
  expect(logger.enabled).toBe(false);
});

test('createAuditLogger returns enabled logger when fully configured', () => {
  const logger = createAuditLogger({
    auditConfig: baseAuditConfig,
    context: { logger: noopLogger },
  });
  expect(logger.enabled).toBe(true);
});

test('logger.log dispatches audit event in fire-and-forget mode', async () => {
  dispatchAuditEvent.mockResolvedValueOnce(undefined);
  const logger = createAuditLogger({
    auditConfig: baseAuditConfig,
    context: { logger: noopLogger, rid: 'req_1' },
  });
  await logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request', id: 'r1' },
    action: 'execute',
    outcome: 'success',
  });
  // Wait for setImmediate scheduled dispatch
  await new Promise((resolve) => setImmediate(resolve));
  expect(dispatchAuditEvent).toHaveBeenCalledTimes(1);
});

test('logger.log skips dispatch when category is not in events list', async () => {
  const logger = createAuditLogger({
    auditConfig: { ...baseAuditConfig, events: ['authorization'] },
    context: { logger: noopLogger },
  });
  await logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
  });
  await new Promise((resolve) => setImmediate(resolve));
  expect(dispatchAuditEvent).not.toHaveBeenCalled();
});

test('logger.log awaits dispatch and propagates error in strict mode', async () => {
  dispatchAuditEvent.mockRejectedValueOnce(new Error('dispatch failed'));
  const logger = createAuditLogger({
    auditConfig: { ...baseAuditConfig, strict: true },
    context: { logger: noopLogger },
  });
  await expect(
    logger.log({
      category: 'request',
      eventType: 'request.execute',
      severity: 'medium',
      target: { type: 'request' },
    })
  ).rejects.toThrow('dispatch failed');
});

test('logger.log warns and swallows error in non-strict mode', async () => {
  dispatchAuditEvent.mockRejectedValueOnce(new Error('dispatch failed'));
  const warnSpy = jest.fn();
  const logger = createAuditLogger({
    auditConfig: baseAuditConfig,
    context: { logger: { ...noopLogger, warn: warnSpy } },
  });
  await logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
  });
  await new Promise((resolve) => setImmediate(resolve));
  expect(warnSpy).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'audit_write_failed' }),
    expect.stringContaining('dispatch failed')
  );
});

test('logger.log applies mask to metadata before dispatch', async () => {
  dispatchAuditEvent.mockResolvedValueOnce(undefined);
  const logger = createAuditLogger({
    auditConfig: { ...baseAuditConfig, strict: true, mask: ['ssn'] },
    context: { logger: noopLogger },
  });
  await logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
    metadata: { payload: { ssn: '111-22-3333', other: 'visible' } },
  });
  const dispatchedEvent = dispatchAuditEvent.mock.calls[0][0].event;
  expect(dispatchedEvent.metadata.payload.ssn).toBe('***MASKED***');
  expect(dispatchedEvent.metadata.payload.other).toBe('visible');
});
