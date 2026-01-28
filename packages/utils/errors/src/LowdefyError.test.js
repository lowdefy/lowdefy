/*
  Copyright 2020-2024 Lowdefy, Inc

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

import LowdefyError from './LowdefyError.js';

test('LowdefyError creates error with formatted message', () => {
  const error = new LowdefyError('Unexpected condition');
  expect(error.message).toBe('[Lowdefy Error] Unexpected condition');
  expect(error.name).toBe('LowdefyError');
  expect(error.rawMessage).toBe('Unexpected condition');
  expect(error.configKey).toBeNull();
});

test('LowdefyError is an instance of Error', () => {
  const error = new LowdefyError('Test');
  expect(error instanceof Error).toBe(true);
  expect(error instanceof LowdefyError).toBe(true);
});

test('LowdefyError with cause option', () => {
  const original = new Error('Original cause');
  const error = new LowdefyError('Wrapped error', { cause: original });
  expect(error.cause).toBe(original);
});

test('LowdefyError.from creates error from existing error', () => {
  const original = new Error('Original error message');
  const lowdefyError = LowdefyError.from(original);

  expect(lowdefyError.message).toBe('[Lowdefy Error] Original error message');
  expect(lowdefyError.name).toBe('LowdefyError');
  expect(lowdefyError.rawMessage).toBe('Original error message');
  expect(lowdefyError.stack).toBe(original.stack);
  expect(lowdefyError.cause).toBe(original);
});

test('LowdefyError.from preserves stack trace', () => {
  const original = new Error('Original');
  const lowdefyError = LowdefyError.from(original);

  expect(lowdefyError.stack).toBe(original.stack);
  expect(lowdefyError.stack).toContain('LowdefyError.test.js');
});

test('LowdefyError has proper stack trace', () => {
  const error = new LowdefyError('Test error');
  expect(error.stack).toContain('LowdefyError');
  expect(error.stack).toContain('LowdefyError.test.js');
});
