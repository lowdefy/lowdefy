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

import buildMonitors from './buildMonitors.js';

function createContext({ keyMap, refMap } = {}) {
  return { keyMap: keyMap ?? {}, refMap: refMap ?? {} };
}

function byId(monitors, id) {
  return monitors.find((monitor) => monitor.id === id);
}

test('buildMonitors returns an empty array when the app declares nothing', () => {
  expect(buildMonitors({ components: {}, context: createContext() })).toEqual([]);
});

test('buildMonitors writes an error rate monitor for every endpoint', () => {
  const monitors = buildMonitors({
    components: { api: [{ endpointId: 'send_invoice', '~k': 'k1' }] },
    context: createContext(),
  });
  expect(monitors).toHaveLength(1);
  expect(monitors[0]).toEqual({
    id: 'endpoint:send_invoice:error_rate',
    unit: { type: 'endpoint', id: 'send_invoice' },
    event: 'endpoint_failed',
    description: 'Endpoint "send_invoice" is failing more than 5% of the time.',
    rule: {
      type: 'error_rate',
      window_minutes: 5,
      threshold: 0.05,
      comparison: 'above',
      failure: { event: 'endpoint_failed', filter: { endpoint_id: 'send_invoice' } },
      total: {
        events: ['endpoint_completed', 'endpoint_failed'],
        filter: { endpoint_id: 'send_invoice' },
      },
    },
    config_key: 'k1',
    source: null,
    status: 'active',
  });
});

test('buildMonitors adds a freshness monitor for a scheduled endpoint at twice the cron interval', () => {
  const monitors = buildMonitors({
    components: { api: [{ endpointId: 'nightly', schedules: [{ cron: '0 2 * * *' }] }] },
    context: createContext(),
  });
  const freshness = byId(monitors, 'endpoint:nightly:freshness');
  expect(freshness.event).toBe('endpoint_completed');
  expect(freshness.rule).toEqual({
    type: 'freshness',
    window_minutes: 2880,
    threshold: 1,
    comparison: 'below',
    expect: { event: 'endpoint_completed', filter: { endpoint_id: 'nightly' } },
    crons: ['0 2 * * *'],
  });
});

test('buildMonitors uses the slowest cron when an endpoint has several schedules', () => {
  const monitors = buildMonitors({
    components: {
      api: [{ endpointId: 'sync', schedules: [{ cron: '*/10 * * * *' }, { cron: '0 0 * * 1' }] }],
    },
    context: createContext(),
  });
  expect(byId(monitors, 'endpoint:sync:freshness').rule.window_minutes).toBe(2 * 7 * 1440);
});

test('buildMonitors does not add a freshness monitor to an unscheduled endpoint', () => {
  const monitors = buildMonitors({
    components: { api: [{ endpointId: 'webhook_in', webhook: true }] },
    context: createContext(),
  });
  expect(byId(monitors, 'endpoint:webhook_in:freshness')).toBeUndefined();
});

test('buildMonitors writes a latency and an error rate monitor for every page request', () => {
  const monitors = buildMonitors({
    components: { pages: [{ pageId: 'home', requests: [{ requestId: 'get_users', '~k': 'k2' }] }] },
    context: createContext(),
  });
  expect(monitors.map((monitor) => monitor.id)).toEqual([
    'page_request:home:get_users:latency_p95',
    'page_request:home:get_users:error_rate',
  ]);
  expect(byId(monitors, 'page_request:home:get_users:latency_p95').rule).toEqual({
    type: 'latency_p95',
    window_minutes: 5,
    threshold_ms: 2000,
    comparison: 'above',
    field: 'duration_ms',
    target: {
      event: 'request_completed',
      filter: { page_id: 'home', request_id: 'get_users' },
    },
  });
});

test('buildMonitors keys the connection monitor on the ServiceError name', () => {
  const monitors = buildMonitors({
    components: { connections: [{ connectionId: 'db', type: 'MongoDBCollection' }] },
    context: createContext(),
  });
  expect(monitors[0].id).toBe('connection:db:service_error_rate');
  expect(monitors[0].rule.failure).toEqual({
    event: 'request_failed',
    filter: { connection_id: 'db', 'error.name': 'ServiceError' },
  });
  expect(monitors[0].rule.total.filter).toEqual({ connection_id: 'db' });
});

test('buildMonitors marks a notification nothing delivers as delivery-unknown', () => {
  const monitors = buildMonitors({
    components: { notifications: [{ notificationId: 'welcome', type: 'EmailTemplate' }] },
    context: createContext(),
  });
  expect(monitors[0].id).toBe('notification:welcome:delivery_failure');
  expect(monitors[0].status).toBe('delivery-unknown');
  expect(monitors[0].event).toBe(null);
  expect(monitors[0].rule).toBe(null);
  expect(monitors[0].delivery).toEqual({ owner: 'none', endpoints: [], auth_flows: [] });
  expect(monitors[0].note).toMatch('Nothing delivers "welcome"');
});

test('buildMonitors points a rendered notification at the endpoint monitor that covers its send', () => {
  const monitors = buildMonitors({
    components: {
      notifications: [{ notificationId: 'invite', type: 'EmailTemplate' }],
      api: [
        {
          endpointId: 'dispatch_invite',
          routine: [
            { id: 'render', type: 'RenderNotification', properties: { notificationId: 'invite' } },
          ],
        },
      ],
    },
    context: createContext(),
  });
  const notification = byId(monitors, 'notification:invite:delivery_failure');
  expect(notification.status).toBe('covered');
  expect(notification.delivery).toEqual({
    owner: 'app',
    endpoints: ['dispatch_invite'],
    auth_flows: [],
  });
  expect(notification.covered_by).toEqual(['endpoint:dispatch_invite:error_rate']);
  expect(byId(monitors, 'endpoint:dispatch_invite:error_rate')).toBeDefined();
});

test('buildMonitors makes an auth email notification an active rule at the app error rate', () => {
  const monitors = buildMonitors({
    components: {
      logger: { monitors: { defaults: { error_rate: 0.1 } } },
      notifications: [{ notificationId: 'verify' }],
      auth: { email: { connectionId: 'smtp', templates: { verifyEmail: 'verify' } } },
    },
    context: createContext(),
  });
  const notification = byId(monitors, 'notification:verify:delivery_failure');
  expect(notification.status).toBe('active');
  expect(notification.event).toBe('notification_failed');
  expect(notification.rule.threshold).toBe(0.1);
  expect(notification.rule.failure.filter).toEqual({ notification_id: 'verify' });
});

test('buildMonitors resolves source to file:line from the keyMap', () => {
  const monitors = buildMonitors({
    components: { api: [{ endpointId: 'send_invoice', '~k': 'k1' }] },
    context: createContext({
      keyMap: { k1: { key: 'root.api[0:send_invoice]', '~r': 'r1', '~l': 12 } },
      refMap: { r1: { path: 'api/send_invoice.yaml' } },
    }),
  });
  expect(monitors[0].source).toBe('api/send_invoice.yaml:12');
});

test('buildMonitors applies logger.monitors.defaults overrides', () => {
  const monitors = buildMonitors({
    components: {
      logger: { monitors: { defaults: { error_rate: 0.2, p95_ms: 500 } } },
      api: [{ endpointId: 'send_invoice' }],
      pages: [{ pageId: 'home', requests: [{ requestId: 'get_users' }] }],
    },
    context: createContext(),
  });
  expect(byId(monitors, 'endpoint:send_invoice:error_rate').rule.threshold).toBe(0.2);
  expect(byId(monitors, 'page_request:home:get_users:latency_p95').rule.threshold_ms).toBe(500);
});

test('buildMonitors throws when logger.monitors.defaults.error_rate is not a fraction', () => {
  expect(() =>
    buildMonitors({
      components: { logger: { monitors: { defaults: { error_rate: 20 } } } },
      context: createContext(),
    })
  ).toThrow('App "logger.monitors.defaults.error_rate" should be a number between 0 and 1.');
});

test('buildMonitors throws when logger.monitors.defaults.p95_ms is not a positive number', () => {
  expect(() =>
    buildMonitors({
      components: { logger: { monitors: { defaults: { p95_ms: '2000' } } } },
      context: createContext(),
    })
  ).toThrow('App "logger.monitors.defaults.p95_ms" should be a positive number.');
});
