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

import OperatorError from './OperatorError.js';
import PluginError from './PluginError.js';

test('OperatorError sets name and is instanceof PluginError', () => {
  const original = new Error('_if requires boolean test');
  const error = new OperatorError(original.message, { cause: original, typeName: '_if' });
  expect(error.name).toBe('OperatorError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.typeName).toBe('_if');
  expect(error instanceof OperatorError).toBe(true);
  expect(error instanceof PluginError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('OperatorError with all fields', () => {
  const original = new Error('_get path must be a string');
  const error = new OperatorError(original.message, {
    cause: original,
    typeName: '_get',
    received: { _get: 42 },
    location: 'blocks.0.visible',
    configKey: 'key-123',
  });
  expect(error.message).toBe('_get path must be a string at blocks.0.visible.');
  expect(error.typeName).toBe('_get');
  expect(error.received).toEqual({ _get: 42 });
  expect(error.configKey).toBe('key-123');
});
