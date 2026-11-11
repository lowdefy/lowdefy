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

import { any, assertMatches } from './index.js';

function failure(run) {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

test('assertMatches passes when the actual object holds more keys than expected, at every depth', () => {
  assertMatches(
    { status: 200, success: true, response: { run: { id: 'BR-1', stage: 'approved', by: 'u1' } } },
    { status: 200, response: { run: { stage: 'approved' } } }
  );
});

test('assertMatches still requires arrays to match item for item', () => {
  assertMatches({ lines: [{ id: 1, amount: 10 }] }, { lines: [{ amount: 10 }] });
  const error = failure(() =>
    assertMatches({ lines: [{ amount: 10 }, { amount: 20 }] }, { lines: [{ amount: 10 }] })
  );
  expect(error.message).toContain('lines has 2 items, expected 1.');
  expect(error.operator).toEqual('assertMatches');
});

test('assertMatches fails on a value that differs and on a key that is missing', () => {
  expect(
    failure(() =>
      assertMatches({ response: { stage: 'draft' } }, { response: { stage: 'approved' } })
    ).message
  ).toContain('response.stage is not equal.');
  expect(
    failure(() => assertMatches({ response: {} }, { response: { stage: 'approved' } })).message
  ).toContain('response.stage is missing.');
});

test('assertMatches takes matchers and names keys that are not identifiers in brackets', () => {
  assertMatches({ 'x-id': 'abc', n: 1 }, { 'x-id': any(String) });
  expect(failure(() => assertMatches({ 'x-id': 1 }, { 'x-id': any(String) })).message).toContain(
    '["x-id"] is not any(String).'
  );
});
