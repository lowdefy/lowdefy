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

test('LowdefyError creates error with message', () => {
  const error = new LowdefyError('Unexpected condition');
  expect(error.message).toBe('Unexpected condition');
  expect(error.name).toBe('LowdefyError');
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

test('LowdefyError has proper stack trace', () => {
  const error = new LowdefyError('Test error');
  expect(error.stack).toContain('LowdefyError');
  expect(error.stack).toContain('LowdefyError.test.js');
});

test('LowdefyError print includes prefix and stack trace', () => {
  const error = new LowdefyError('Something broke');
  const output = error.print();
  expect(output).toContain('[LowdefyError] Something broke');
  expect(output).toContain('LowdefyError.test.js');
});

test('LowdefyError serialize includes stack trace', () => {
  const error = new LowdefyError('Test error');
  const serialized = error.serialize();

  expect(serialized).toEqual({
    '~err': 'LowdefyError',
    message: 'Test error',
    stack: error.stack,
  });
  expect(serialized.stack).toContain('LowdefyError.test.js');
});

test('LowdefyError deserialize restores error with stack trace', () => {
  const original = new LowdefyError('Original error');
  const serialized = original.serialize();
  const restored = LowdefyError.deserialize(serialized);

  expect(restored.name).toBe('LowdefyError');
  expect(restored.message).toBe('Original error');
  expect(restored.stack).toBe(original.stack);
  expect(restored.stack).toContain('LowdefyError.test.js');
});

test('LowdefyError serialize/deserialize roundtrip preserves stack', () => {
  const original = new LowdefyError('Roundtrip test');
  const json = JSON.stringify(original.serialize());
  const parsed = JSON.parse(json);
  const restored = LowdefyError.deserialize(parsed);

  expect(restored.message).toBe(original.message);
  expect(restored.stack).toBe(original.stack);
});

test('LowdefyError deserialize handles missing stack', () => {
  const data = {
    '~err': 'LowdefyError',
    message: 'No stack error',
  };
  const error = LowdefyError.deserialize(data);

  expect(error.name).toBe('LowdefyError');
  expect(error.message).toBe('No stack error');
  // Will have its own stack from construction
  expect(error.stack).toContain('LowdefyError');
});
