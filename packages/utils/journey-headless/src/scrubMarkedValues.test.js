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

import { expect, test } from 'vitest';

import scrubMarkedValues from './scrubMarkedValues.js';

const scrubs = [
  (text) => text.replaceAll('one-secret', '[REDACTED]'),
  (text) => text.replaceAll('two-secret', '[REDACTED]'),
];

test('scrubMarkedValues scrubs every string of a result with every scrub', () => {
  const error = new TypeError('Failed with two-secret.');
  expect(
    scrubMarkedValues({
      scrubs,
      value: {
        failure: { message: 'Got one-secret and two-secret.', index: 1 },
        calls: [{ response: { token: 'one-secret' }, status: 200, error }],
        passed: false,
      },
    })
  ).toEqual({
    failure: { message: 'Got [REDACTED] and [REDACTED].', index: 1 },
    calls: [{ response: { token: '[REDACTED]' }, status: 200, error: expect.any(Error) }],
    passed: false,
  });
  const scrubbed = scrubMarkedValues({ scrubs, value: error });
  expect(scrubbed.message).toEqual('Failed with [REDACTED].');
  expect(scrubbed.name).toEqual('TypeError');
});

test('scrubMarkedValues returns the value as it is when no call marked anything', () => {
  const value = { message: 'one-secret' };
  expect(scrubMarkedValues({ scrubs: [], value })).toBe(value);
});
