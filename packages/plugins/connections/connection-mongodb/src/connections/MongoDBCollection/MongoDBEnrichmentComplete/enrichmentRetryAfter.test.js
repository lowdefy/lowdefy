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

import { validate } from '@lowdefy/ajv';

import compileEnrichmentComplete from './compileEnrichmentComplete.js';
import planCompleteCell from './planCompleteCell.js';
import schema from './schema.js';

// A result's retryAfterMs: how long the provider asked to wait (a rate limit's Retry-After,
// such as treg's retry_after on a 429 or 503), in place of the exponential backoff.

const now = new Date('2026-09-29T10:00:00.000Z');
const token = `${'b'.repeat(24)}:${'0123456789abcd'}`;
const columnDefs = [
  { key: 'domain' },
  { key: 'email', kind: 'enrichment', provider: 'finder', inputs: { d: { column: 'domain' } } },
];
const result = { rowKey: 'r1', columnKey: 'email', claimToken: token, status: 'error' };

function parse(overrides, properties = {}) {
  return compileEnrichmentComplete({
    properties: { columnDefs, filter: {}, results: [{ ...result, ...overrides }], ...properties },
  });
}

function plan(overrides, { attempts = 1, properties } = {}) {
  const compiled = parse(overrides, properties);
  return planCompleteCell({
    result: compiled.results[0],
    doc: { _id: 'id1', _enrich: { email: { attempts } } },
    compiled,
    now,
  });
}

function queuedAtOf(cell) {
  return cell.operation.updateOne.update.$set['_enrich.email.queuedAt'];
}

test('MongoDBEnrichmentComplete queues an error with retryAfterMs again after it', () => {
  const cell = plan({ error: 'busy', retryAfterMs: 7000 }, { attempts: 2 });
  expect(cell.kind).toBe('requeue');
  expect(queuedAtOf(cell)).toEqual(new Date('2026-09-29T10:00:07.000Z'));
});

test('MongoDBEnrichmentComplete takes a retryAfterMs of 0 as due at once', () => {
  expect(queuedAtOf(plan({ retryAfterMs: 0 }))).toEqual(now);
});

test('MongoDBEnrichmentComplete falls back to the exponential backoff without retryAfterMs', () => {
  expect(queuedAtOf(plan({}, { attempts: 2 }))).toEqual(new Date('2026-09-29T10:01:00.000Z'));
  expect(queuedAtOf(plan({ retryAfterMs: null }, { attempts: 2 }))).toEqual(
    new Date('2026-09-29T10:01:00.000Z')
  );
});

test('MongoDBEnrichmentComplete waits at most a day for a retryAfterMs', () => {
  expect(queuedAtOf(plan({ retryAfterMs: 3 * 86400000 }))).toEqual(
    new Date(now.getTime() + 86400000)
  );
});

test('MongoDBEnrichmentComplete makes an error final on the last attempt whatever retryAfterMs', () => {
  const lastAttempt = plan({ retryAfterMs: 1000 }, { attempts: 3 });
  expect(lastAttempt.kind).toBe('error');
  expect(queuedAtOf(lastAttempt)).toBeUndefined();
  expect(plan({ retryAfterMs: 1000, retry: false }).kind).toBe('error');
});

test('MongoDBEnrichmentComplete ignores retryAfterMs on an ok result', () => {
  const cell = plan({ status: 'ok', value: 'a@b', retryAfterMs: 1000 });
  expect(cell.kind).toBe('ok');
  expect(queuedAtOf(cell)).toBeUndefined();
});

test('MongoDBEnrichmentComplete refuses a retryAfterMs that is not a whole number of milliseconds', () => {
  [1.5, -1, '1000'].forEach((retryAfterMs) => {
    expect(() => parse({ retryAfterMs })).toThrow(
      'MongoDBEnrichmentComplete "results" item 0 "retryAfterMs" should be a whole number of milliseconds, 0 or more.'
    );
  });
});

test('MongoDBEnrichmentComplete schema accepts retryAfterMs on a result', () => {
  [5000, 0, null].forEach((retryAfterMs) => {
    expect(
      validate({ schema, data: { columnDefs, results: [{ ...result, retryAfterMs }] } })
    ).toEqual({ valid: true });
  });
  expect(() =>
    validate({ schema, data: { columnDefs, results: [{ ...result, retryAfterMs: -1 }] } })
  ).toThrow();
});
