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

import shouldAuditEvent from './shouldAuditEvent.js';

const baseConfig = {
  events: ['request', 'authorization'],
  severity: 'medium',
};

test('shouldAuditEvent returns true for category in events list at meeting severity', () => {
  expect(
    shouldAuditEvent({
      event: { category: 'request', severity: 'medium', target: { type: 'request' } },
      auditConfig: baseConfig,
    })
  ).toBe(true);
});

test('shouldAuditEvent returns false for category not in events list', () => {
  expect(
    shouldAuditEvent({
      event: { category: 'endpoint', severity: 'medium', target: { type: 'endpoint' } },
      auditConfig: baseConfig,
    })
  ).toBe(false);
});

test('shouldAuditEvent returns false when severity is below threshold', () => {
  expect(
    shouldAuditEvent({
      event: { category: 'request', severity: 'low', target: { type: 'request' } },
      auditConfig: baseConfig,
    })
  ).toBe(false);
});

test('shouldAuditEvent excludes events targeting excluded request id', () => {
  expect(
    shouldAuditEvent({
      event: {
        category: 'request',
        severity: 'medium',
        target: { type: 'request', id: 'fetch_dropdown' },
      },
      auditConfig: { ...baseConfig, exclude: { requests: ['fetch_dropdown'] } },
    })
  ).toBe(false);
});

test('shouldAuditEvent excludes events on excluded page', () => {
  expect(
    shouldAuditEvent({
      event: {
        category: 'request',
        severity: 'medium',
        target: { type: 'request', id: 'r1', pageId: 'public-landing' },
      },
      auditConfig: { ...baseConfig, exclude: { pages: ['public-landing'] } },
    })
  ).toBe(false);
});

test('shouldAuditEvent allows non-excluded events to pass', () => {
  expect(
    shouldAuditEvent({
      event: {
        category: 'request',
        severity: 'medium',
        target: { type: 'request', id: 'fetch_users', pageId: 'admin' },
      },
      auditConfig: { ...baseConfig, exclude: { requests: ['other'] } },
    })
  ).toBe(true);
});

test('shouldAuditEvent with include only allows matching events', () => {
  expect(
    shouldAuditEvent({
      event: {
        category: 'request',
        severity: 'medium',
        target: { type: 'request', id: 'allowed' },
      },
      auditConfig: { ...baseConfig, include: { requests: ['allowed'] } },
    })
  ).toBe(true);

  expect(
    shouldAuditEvent({
      event: {
        category: 'request',
        severity: 'medium',
        target: { type: 'request', id: 'other' },
      },
      auditConfig: { ...baseConfig, include: { requests: ['allowed'] } },
    })
  ).toBe(false);
});
