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

import isForcedFailure from './isForcedFailure.js';
import markForcedFailure from './markForcedFailure.js';
import ServiceError from './ServiceError.js';

test('isForcedFailure is true for an error markForcedFailure branded', () => {
  const error = markForcedFailure(new ServiceError('Write failed on purpose'));
  expect(isForcedFailure(error)).toBe(true);
});

test('isForcedFailure is false for a plain error that carries forced: true', () => {
  const error = new Error('Not a test failure');
  error.forced = true;
  expect(isForcedFailure(error)).toBe(false);
});

test('the forced failure brand is not enumerable, so a copy of the error does not keep it', () => {
  const error = markForcedFailure(new Error('Write failed on purpose'));
  expect(Object.keys(error)).toEqual([]);
  expect(isForcedFailure({ ...error })).toBe(false);
  expect(JSON.parse(JSON.stringify(error))).toEqual({});
});

test('isForcedFailure is false for null and undefined', () => {
  expect(isForcedFailure(null)).toBe(false);
  expect(isForcedFailure(undefined)).toBe(false);
});
