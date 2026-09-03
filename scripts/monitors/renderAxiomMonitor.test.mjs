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

import assert from 'node:assert/strict';
import test from 'node:test';

import renderAxiomMonitor, { monitorName } from './renderAxiomMonitor.mjs';

const errorRateMonitor = {
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
  source: 'api/send_invoice.yaml:12',
  status: 'active',
};

test('renderAxiomMonitor renders an error rate rule as an APL ratio over the dataset', () => {
  const payload = renderAxiomMonitor({
    monitor: errorRateMonitor,
    app: 'invoices',
    dataset: 'lowdefy-prod',
  });
  assert.equal(payload.name, 'lowdefy:invoices:endpoint:send_invoice:error_rate');
  assert.equal(payload.type, 'Threshold');
  assert.equal(payload.operator, 'Above');
  assert.equal(payload.threshold, 0.05);
  assert.equal(payload.range, '5m');
  assert.equal(payload.intervalMinutes, 3);
  assert.equal(payload.alertOnNoData, false);
  assert.equal(
    payload.aplQuery,
    [
      "['lowdefy-prod']",
      "| where event in ('endpoint_completed', 'endpoint_failed') and endpoint_id == 'send_invoice'",
      "| summarize failures = countif(event == 'endpoint_failed' and endpoint_id == 'send_invoice'), total = count()",
      '| project error_rate = todouble(failures) / todouble(total)',
    ].join('\n')
  );
});

test('renderAxiomMonitor puts the config source in the description so an alert points at config', () => {
  const payload = renderAxiomMonitor({
    monitor: errorRateMonitor,
    app: 'invoices',
    dataset: 'lowdefy-prod',
  });
  assert.match(payload.description, /Config: api\/send_invoice\.yaml:12/);
});

test('renderAxiomMonitor renders a p95 latency rule', () => {
  const payload = renderAxiomMonitor({
    monitor: {
      id: 'page_request:home:get_users:latency_p95',
      rule: {
        type: 'latency_p95',
        window_minutes: 5,
        threshold_ms: 2000,
        comparison: 'above',
        field: 'duration_ms',
        target: {
          event: 'request_completed',
          filter: { page_id: 'home', request_id: 'get_users' },
        },
      },
      description: 'slow',
      source: null,
      status: 'active',
    },
    app: 'invoices',
    dataset: 'ds',
  });
  assert.equal(payload.threshold, 2000);
  assert.equal(
    payload.aplQuery,
    [
      "['ds']",
      "| where event == 'request_completed' and page_id == 'home' and request_id == 'get_users'",
      '| summarize p95_duration_ms = percentile(duration_ms, 95)',
    ].join('\n')
  );
});

test('renderAxiomMonitor renders a freshness rule as a count below one that alerts on no data', () => {
  const payload = renderAxiomMonitor({
    monitor: {
      id: 'endpoint:nightly:freshness',
      rule: {
        type: 'freshness',
        window_minutes: 2880,
        threshold: 1,
        comparison: 'below',
        expect: { event: 'endpoint_completed', filter: { endpoint_id: 'nightly' } },
        crons: ['0 2 * * *'],
      },
      description: 'stale',
      source: null,
      status: 'active',
    },
    app: 'invoices',
    dataset: 'ds',
  });
  assert.equal(payload.operator, 'Below');
  assert.equal(payload.threshold, 1);
  assert.equal(payload.range, '2d');
  assert.equal(payload.intervalMinutes, 1440);
  assert.equal(payload.alertOnNoData, true);
  assert.equal(
    payload.aplQuery,
    [
      "['ds']",
      "| where event == 'endpoint_completed' and endpoint_id == 'nightly'",
      '| summarize completions = count()',
    ].join('\n')
  );
});

test('renderAxiomMonitor keeps the error name filter on a connection rule', () => {
  const payload = renderAxiomMonitor({
    monitor: {
      id: 'connection:db:service_error_rate',
      rule: {
        type: 'error_rate',
        window_minutes: 5,
        threshold: 0.05,
        comparison: 'above',
        failure: {
          event: 'request_failed',
          filter: { connection_id: 'db', 'error.name': 'ServiceError' },
        },
        total: { events: ['request_completed', 'request_failed'], filter: { connection_id: 'db' } },
      },
      description: 'db',
      source: null,
      status: 'active',
    },
    app: 'invoices',
    dataset: 'ds',
  });
  assert.match(
    payload.aplQuery,
    /countif\(event == 'request_failed' and connection_id == 'db' and error\.name == 'ServiceError'\)/
  );
});

test('renderAxiomMonitor refuses to render a monitor with no event to watch', () => {
  assert.throws(
    () =>
      renderAxiomMonitor({
        monitor: { id: 'notification:welcome:delivery_failure', status: 'no-event-yet' },
        app: 'invoices',
        dataset: 'ds',
      }),
    /status "no-event-yet"/
  );
});

test('monitorName is the idempotency key', () => {
  assert.equal(
    monitorName({ app: 'invoices', monitor: { id: 'connection:db:service_error_rate' } }),
    'lowdefy:invoices:connection:db:service_error_rate'
  );
});
