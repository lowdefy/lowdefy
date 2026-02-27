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

import LowdefyInternalError from './LowdefyInternalError.js';

test('LowdefyInternalError creates error with message', () => {
  const error = new LowdefyInternalError('Unexpected condition');
  expect(error.message).toBe('Unexpected condition');
  expect(error.name).toBe('LowdefyInternalError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.configKey).toBeNull();
});

test('LowdefyInternalError is an instance of Error', () => {
  const error = new LowdefyInternalError('Test');
  expect(error instanceof Error).toBe(true);
  expect(error instanceof LowdefyInternalError).toBe(true);
});

test('LowdefyInternalError with cause option', () => {
  const original = new Error('Original cause');
  const error = new LowdefyInternalError('Wrapped error', { cause: original });
  expect(error.cause).toBe(original);
});

test('LowdefyInternalError has proper stack trace', () => {
  const error = new LowdefyInternalError('Test error');
  expect(error.stack).toContain('LowdefyInternalError');
  expect(error.stack).toContain('LowdefyInternalError.test.js');
});
