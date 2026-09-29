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

import formatMeta from './formatMeta.js';
import parseCost from './parseCost.js';
import readRetryAfter from './readRetryAfter.js';

test('formatMeta joins tags as key=value pairs and drops empty values', () => {
  expect(formatMeta({ customer: 'cust_1', workspace: 9, empty: null })).toBe(
    'customer=cust_1, workspace=9'
  );
  expect(formatMeta({})).toBeNull();
  expect(formatMeta(undefined)).toBeNull();
});

test('parseCost reads integer micro-USD and treats a missing or malformed header as no charge', () => {
  expect(parseCost('4000')).toEqual({ micro: 4000, usd: 0.004 });
  expect(parseCost(' 1 ')).toEqual({ micro: 1, usd: 0.000001 });
  expect(parseCost(null)).toEqual({ micro: 0, usd: 0 });
  expect(parseCost('-5')).toEqual({ micro: 0, usd: 0 });
  expect(parseCost('0.4')).toEqual({ micro: 0, usd: 0 });
});

test('readRetryAfter returns null when treg says nothing about waiting', () => {
  expect(readRetryAfter({ headers: new Headers(), detail: {} })).toBeNull();
  expect(
    readRetryAfter({ headers: new Headers({ 'retry-after': 'soon' }), detail: {} })
  ).toBeNull();
});

test('readRetryAfter reads retry_after_s and a past resets_at as zero', () => {
  expect(readRetryAfter({ headers: new Headers(), detail: { retry_after_s: 5 } })).toBe(5);
  expect(
    readRetryAfter({ headers: new Headers(), detail: { resets_at: '2000-01-01T00:00:00Z' } })
  ).toBe(0);
});
