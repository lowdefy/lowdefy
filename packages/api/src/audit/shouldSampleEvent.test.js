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

import shouldSampleEvent from './shouldSampleEvent.js';

test('shouldSampleEvent returns true when sampling is undefined', () => {
  expect(shouldSampleEvent({ event: { category: 'request' } })).toBe(true);
});

test('shouldSampleEvent returns true when category rate is undefined', () => {
  expect(
    shouldSampleEvent({
      event: { category: 'request' },
      sampling: { auth: 0.5 },
    })
  ).toBe(true);
});

test('shouldSampleEvent returns true when rate is 1', () => {
  expect(
    shouldSampleEvent({
      event: { category: 'request' },
      sampling: { request: 1 },
    })
  ).toBe(true);
});

test('shouldSampleEvent returns false when rate is 0', () => {
  expect(
    shouldSampleEvent({
      event: { category: 'request' },
      sampling: { request: 0 },
    })
  ).toBe(false);
});

test('shouldSampleEvent uses random < rate semantics', () => {
  const result = shouldSampleEvent({
    event: { category: 'request' },
    sampling: { request: 0.3 },
    random: () => 0.2,
  });
  expect(result).toBe(true);
});

test('shouldSampleEvent rejects when random >= rate', () => {
  const result = shouldSampleEvent({
    event: { category: 'request' },
    sampling: { request: 0.3 },
    random: () => 0.5,
  });
  expect(result).toBe(false);
});

test('shouldSampleEvent rejects when random equals rate (strictly less than semantics)', () => {
  const result = shouldSampleEvent({
    event: { category: 'request' },
    sampling: { request: 0.3 },
    random: () => 0.3,
  });
  expect(result).toBe(false);
});
