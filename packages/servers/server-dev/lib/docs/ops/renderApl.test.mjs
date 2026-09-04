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

import renderApl from './renderApl.js';

test('renderApl renders a filter query with a time window, order and limit', () => {
  expect(
    renderApl({
      dataset: 'lowdefy-prod',
      where: [
        ['event', 'eq', 'request_failed'],
        ['success', 'eq', false],
      ],
      since: '2026-09-01T00:00:00.000Z',
      until: '2026-09-02T00:00:00.000Z',
      order: 'desc',
      limit: 25,
    })
  ).toBe(
    "['lowdefy-prod'] | where event == 'request_failed' and success == false and " +
      "_time >= datetime('2026-09-01T00:00:00.000Z') and " +
      "_time <= datetime('2026-09-02T00:00:00.000Z') | order by _time desc | limit 25"
  );
});

test('renderApl renders an aggregation ordered by its first metric', () => {
  expect(
    renderApl({
      dataset: 'lowdefy-prod',
      where: [['success', 'eq', false]],
      groupBy: ['config_key', 'error.name'],
      metrics: ['count'],
      limit: 20,
    })
  ).toBe(
    "['lowdefy-prod'] | where success == false | " +
      'summarize count=count() by config_key, error.name | order by count desc | limit 20'
  );
});

test('renderApl renders a percentile metric', () => {
  expect(
    renderApl({
      dataset: 'lowdefy-prod',
      groupBy: ['endpoint_id'],
      metrics: ['p95:duration_ms', 'count'],
    })
  ).toBe(
    "['lowdefy-prod'] | summarize p95_duration_ms=percentile(duration_ms, 95), count=count() " +
      'by endpoint_id | order by p95_duration_ms desc'
  );
});

test('renderApl renders in, isnull and isnotnull clauses', () => {
  expect(
    renderApl({
      dataset: 'd',
      where: [
        ['event', 'in', ['request_failed', 'step_failed']],
        ['config_key', 'ne', null],
        ['page_id', 'eq', null],
      ],
    })
  ).toBe(
    "['d'] | where event in ('request_failed', 'step_failed') and isnotnull(config_key) and " +
      'isnull(page_id) | order by _time asc'
  );
});

test('renderApl escapes quotes in a string literal', () => {
  expect(renderApl({ dataset: 'd', where: [['error.message', 'eq', "it's broken"]] })).toContain(
    "error.message == 'it\\'s broken'"
  );
});

test('renderApl rejects a field name that is not a field name', () => {
  expect(() => renderApl({ dataset: 'd', where: [["event' | project x", 'eq', 'a']] })).toThrow(
    'Ops query field is not a field name.'
  );
});

test('renderApl rejects a non-scalar value rather than interpolating it', () => {
  expect(() => renderApl({ dataset: 'd', where: [['event', 'eq', { a: 1 }]] })).toThrow(
    'Ops query value is not a scalar.'
  );
});

test('renderApl rejects an unknown operator', () => {
  expect(() => renderApl({ dataset: 'd', where: [['event', 'like', 'a']] })).toThrow(
    'Ops query operator "like" is not one of'
  );
});

test('renderApl rejects an unknown metric aggregation', () => {
  expect(() =>
    renderApl({ dataset: 'd', groupBy: ['event'], metrics: ['median:duration_ms'] })
  ).toThrow('Ops metric aggregation "median" is not one of');
});

test('renderApl rejects a missing dataset', () => {
  expect(() => renderApl({ dataset: undefined })).toThrow('Ops query dataset is missing.');
});
