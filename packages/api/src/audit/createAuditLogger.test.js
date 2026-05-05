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

import createAuditLogger from './createAuditLogger.js';

function makeAuditConfig(overrides = {}) {
  return {
    enabled: true,
    events: ['request', 'authorization', 'auth', 'error'],
    severity: 'medium',
    capture: {},
    fields: {},
    mask: [],
    sampling: {},
    rateLimit: {},
    ...overrides,
  };
}

function makeContext({ child, info = jest.fn(), warn = jest.fn() } = {}) {
  const auditChildLogger = { info };
  const parentLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn,
    error: jest.fn(),
    child: child ?? jest.fn(() => auditChildLogger),
  };
  return {
    rid: 'req_1',
    logger: parentLogger,
    auditChildLogger,
  };
}

test('createAuditLogger returns no-op when auditConfig is undefined', () => {
  const logger = createAuditLogger({ auditConfig: undefined, context: {} });
  expect(logger.enabled).toBe(false);
  expect(logger.log({ category: 'request' })).toBeUndefined();
});

test('createAuditLogger returns no-op when auditConfig.enabled is false', () => {
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ enabled: false }),
    context: makeContext(),
  });
  expect(logger.enabled).toBe(false);
});

test('createAuditLogger returns no-op when events list is empty', () => {
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ events: [] }),
    context: makeContext(),
  });
  expect(logger.enabled).toBe(false);
});

test('createAuditLogger returns no-op when context.logger has no child method', () => {
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig(),
    context: { logger: { info: jest.fn() } },
  });
  expect(logger.enabled).toBe(false);
});

test('createAuditLogger returns enabled logger when fully configured', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({ auditConfig: makeAuditConfig(), context: ctx });
  expect(logger.enabled).toBe(true);
  expect(ctx.logger.child).toHaveBeenCalledWith({ audit: true });
});

test('logger.log emits structured pino info call with audit_event marker', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({ auditConfig: makeAuditConfig(), context: ctx });
  logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request', id: 'r1' },
    action: 'execute',
    outcome: 'success',
  });
  expect(ctx.auditChildLogger.info).toHaveBeenCalledTimes(1);
  const [payload, message] = ctx.auditChildLogger.info.mock.calls[0];
  expect(payload.event).toBe('audit_event');
  expect(payload.auditEvent.eventType).toBe('request.execute');
  expect(payload.auditEvent.target).toEqual({ type: 'request', id: 'r1' });
  expect(payload.auditEvent.rid).toBe('req_1');
  expect(message).toBe('audit request.execute');
});

test('logger.log skips emission when category is not in events list', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ events: ['authorization'] }),
    context: ctx,
  });
  logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
  });
  expect(ctx.auditChildLogger.info).not.toHaveBeenCalled();
});

test('logger.log applies mask to metadata before emit', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ mask: ['ssn'] }),
    context: ctx,
  });
  logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
    metadata: { payload: { ssn: '111-22-3333', other: 'visible' } },
  });
  const emittedEvent = ctx.auditChildLogger.info.mock.calls[0][0].auditEvent;
  expect(emittedEvent.metadata.payload.ssn).toBe('***MASKED***');
  expect(emittedEvent.metadata.payload.other).toBe('visible');
});

test('logger.log respects sampling rate of 0', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ sampling: { request: 0 } }),
    context: ctx,
  });
  logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
  });
  expect(ctx.auditChildLogger.info).not.toHaveBeenCalled();
});

test('logger.log respects rate limit and warns when exceeded', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({
    auditConfig: makeAuditConfig({ rateLimit: { perSecond: 2 } }),
    context: ctx,
  });
  const event = {
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
  };
  logger.log({ ...event });
  logger.log({ ...event });
  logger.log({ ...event });
  expect(ctx.auditChildLogger.info).toHaveBeenCalledTimes(2);
});

test('logger.log emits the rid bound on the parent child logger automatically', () => {
  const ctx = makeContext();
  const logger = createAuditLogger({ auditConfig: makeAuditConfig(), context: ctx });
  logger.log({
    category: 'request',
    eventType: 'request.execute',
    severity: 'medium',
    target: { type: 'request' },
    rid: 'override_rid',
  });
  // event.rid takes precedence over context.rid when explicitly supplied
  expect(ctx.auditChildLogger.info.mock.calls[0][0].auditEvent.rid).toBe('override_rid');
});
