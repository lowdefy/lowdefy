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

import ActionError from './ActionError.js';
import PluginError from './PluginError.js';

test('ActionError sets name and is instanceof PluginError', () => {
  const original = new Error('SetState requires params');
  const error = new ActionError(original.message, { cause: original, typeName: 'SetState' });
  expect(error.name).toBe('ActionError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.typeName).toBe('SetState');
  expect(error instanceof ActionError).toBe(true);
  expect(error instanceof PluginError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('ActionError with all fields', () => {
  const original = new Error('Request failed');
  const error = new ActionError(original.message, {
    cause: original,
    typeName: 'Request',
    received: { requestId: 'get_data' },
    location: 'myBlock',
    configKey: 'key-456',
  });
  expect(error.message).toBe('Request failed at myBlock.');
  expect(error.typeName).toBe('Request');
  expect(error.received).toEqual({ requestId: 'get_data' });
  expect(error.configKey).toBe('key-456');
});
