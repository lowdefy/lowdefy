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

import readAnswer from './readAnswer.js';

test('readAnswer returns the body of a 200 answer', () => {
  const body = { response: { ok: 1 }, success: true };
  expect(readAnswer({ status: 200, body })).toBe(body);
});

test('readAnswer throws an expected refusal as its error class, by name', () => {
  expect(() =>
    readAnswer({ status: 403, body: { name: 'AuthorizationError', message: 'Not allowed.' } })
  ).toThrow(expect.objectContaining({ name: 'AuthorizationError', message: 'Not allowed.' }));
});

test('readAnswer throws the message of a body that carries no error', () => {
  expect(() => readAnswer({ status: 400, body: { message: 'Bad payload.' } })).toThrow(
    'Bad payload.'
  );
});
