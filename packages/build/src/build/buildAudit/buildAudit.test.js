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

function makeContext() {
  return {
    errors: [],
    keyMap: {},
  };
}

function validAudit(overrides = {}) {
  const audit = {
    events: ['request', 'authorization'],
    ...overrides,
  };
  Object.defineProperty(audit, '~k', { value: 'logger.audit', enumerable: false });
  return audit;
}

function makeLogger(audit) {
  const logger = audit ? { audit } : {};
  Object.defineProperty(logger, '~k', { value: 'logger', enumerable: false });
  return logger;
}

test('buildAudit leaves logger.audit undefined when not configured', () => {
  const components = { logger: makeLogger() };
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.logger.audit).toBeUndefined();
  expect(context.errors).toHaveLength(0);
});

test('buildAudit returns components when logger is undefined', () => {
  const components = {};
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.logger).toBeUndefined();
  expect(context.errors).toHaveLength(0);
});

test('buildAudit fills default enabled, severity, mask, fields, capture, sampling, rateLimit', () => {
  const components = { logger: makeLogger(validAudit()) };
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.logger.audit.enabled).toBe(true);
  expect(components.logger.audit.severity).toBe('medium');
  expect(components.logger.audit.mask).toEqual([]);
  expect(components.logger.audit.fields).toEqual({});
  expect(components.logger.audit.capture).toEqual({});
  expect(components.logger.audit.sampling).toEqual({});
  expect(components.logger.audit.rateLimit).toEqual({});
  expect(context.errors).toHaveLength(0);
});

test('buildAudit preserves explicit enabled: false', () => {
  const components = { logger: makeLogger(validAudit({ enabled: false })) };
  const context = makeContext();
  buildAudit({ components, context });
  expect(components.logger.audit.enabled).toBe(false);
  expect(context.errors).toHaveLength(0);
});

test('buildAudit collects error when both exclude and include are set', () => {
  const components = {
    logger: makeLogger(
      validAudit({
        exclude: { requests: ['x'] },
        include: { requests: ['y'] },
      })
    ),
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/cannot have both/);
});

test('buildAudit collects error when events list is missing', () => {
  const audit = {};
  Object.defineProperty(audit, '~k', { value: 'logger.audit', enumerable: false });
  const components = { logger: makeLogger(audit) };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors.length).toBeGreaterThanOrEqual(1);
});

test('buildAudit collects error when exclude references unknown request id', () => {
  const components = {
    logger: makeLogger(validAudit({ exclude: { requests: ['unknown_request'] } })),
    pages: [{ pageId: 'page1', requests: [{ requestId: 'known_request' }] }],
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors.length).toBeGreaterThanOrEqual(1);
  expect(context.errors[0].message).toMatch(/unknown request "unknown_request"/);
});

test('buildAudit accepts exclude with known ids', () => {
  const components = {
    logger: makeLogger(validAudit({ exclude: { requests: ['known_request'] } })),
    pages: [{ pageId: 'page1', requests: [{ requestId: 'known_request' }] }],
  };
  const context = makeContext();
  buildAudit({ components, context });
  expect(context.errors).toHaveLength(0);
});
