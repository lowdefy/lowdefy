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

import buildAuditEvent from './buildAuditEvent.js';

test('buildAuditEvent assigns id with evt_ prefix and ISO timestamp', () => {
  const result = buildAuditEvent({
    event: { category: 'request', eventType: 'request.execute', action: 'execute' },
    context: { rid: 'req_xyz' },
  });
  expect(result.id).toMatch(/^evt_/);
  expect(typeof result.timestamp).toBe('string');
  expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
});

test('buildAuditEvent passes through CADF fields and rid', () => {
  const result = buildAuditEvent({
    event: {
      category: 'request',
      eventType: 'request.execute',
      severity: 'medium',
      initiator: { userId: 'u1' },
      target: { type: 'request', id: 'r1' },
      action: 'execute',
      outcome: 'success',
      metadata: { foo: 'bar' },
    },
    context: { rid: 'req_xyz' },
  });
  expect(result.eventType).toBe('request.execute');
  expect(result.category).toBe('request');
  expect(result.severity).toBe('medium');
  expect(result.initiator).toEqual({ userId: 'u1' });
  expect(result.target).toEqual({ type: 'request', id: 'r1' });
  expect(result.action).toBe('execute');
  expect(result.outcome).toBe('success');
  expect(result.metadata).toEqual({ foo: 'bar' });
  expect(result.rid).toBe('req_xyz');
});

test('buildAuditEvent merges appFields onto the event', () => {
  const result = buildAuditEvent({
    event: { category: 'request', eventType: 'request.execute' },
    context: {},
    appFields: { appName: 'My App', env: 'prod' },
  });
  expect(result.appFields).toEqual({ appName: 'My App', env: 'prod' });
});

test('buildAuditEvent defaults severity to medium when not provided', () => {
  const result = buildAuditEvent({
    event: { category: 'request', eventType: 'request.execute' },
    context: {},
  });
  expect(result.severity).toBe('medium');
});
