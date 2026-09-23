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

import { jest } from '@jest/globals';

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(() => 'from getFromObject'),
}));

const caught = new Error('Caught.');

beforeEach(async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  lowdefyOperators.getFromObject.mockClear();
});

test('_error true returns the caught error itself', async () => {
  const _error = (await import('./error.js')).default;
  expect(_error({ error: caught, location: 'location', params: true })).toBe(caught);
});

test('_error all true returns the caught error itself', async () => {
  const _error = (await import('./error.js')).default;
  expect(_error({ error: caught, location: 'location', params: { all: true } })).toBe(caught);
});

test('_error true returns null outside a catch list', async () => {
  const _error = (await import('./error.js')).default;
  expect(_error({ error: null, location: 'location', params: true })).toBe(null);
  expect(_error({ location: 'location', params: { all: true } })).toBe(null);
});

test('_error with a key calls getFromObject over the caught error', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const _error = (await import('./error.js')).default;
  const res = _error({
    arrayIndices: [0],
    error: caught,
    location: 'location',
    params: 'statusCode',
  });
  expect(res).toBe('from getFromObject');
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: caught,
        operator: '_error',
        params: 'statusCode',
      },
    ],
  ]);
});

test('_error with a key reads an empty object outside a catch list', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const _error = (await import('./error.js')).default;
  _error({ error: null, location: 'location', params: { key: 'message', default: 'none' } });
  expect(lowdefyOperators.getFromObject.mock.calls[0][0].object).toEqual({});
});

test('_error is dynamic', async () => {
  const _error = (await import('./error.js')).default;
  expect(_error.dynamic).toBe(true);
});
