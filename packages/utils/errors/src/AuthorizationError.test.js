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

import AuthorizationError from './AuthorizationError.js';

test('AuthorizationError sets name and isLowdefyError', () => {
  const error = new AuthorizationError();
  expect(error.name).toBe('AuthorizationError');
  expect(error.isLowdefyError).toBe(true);
  expect(error instanceof AuthorizationError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('AuthorizationError uses the default message', () => {
  const error = new AuthorizationError();
  expect(error.message).toBe('Forbidden.');
});

test('AuthorizationError keeps the gate-written message', () => {
  const error = new AuthorizationError('Request "getData" does not exist.');
  expect(error.message).toBe('Request "getData" does not exist.');
});

test('AuthorizationError forwards cause to super', () => {
  const inner = new Error('inner failure');
  const error = new AuthorizationError('outer', { cause: inner });
  expect(error.cause).toBe(inner);
});
