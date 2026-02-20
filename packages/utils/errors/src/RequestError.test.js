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

import RequestError from './RequestError.js';
import PluginError from './PluginError.js';

test('RequestError sets name and is instanceof PluginError', () => {
  const original = new Error('Collection not found');
  const error = new RequestError(original.message, { cause: original, typeName: 'MongoDBFind' });
  expect(error.name).toBe('RequestError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.typeName).toBe('MongoDBFind');
  expect(error instanceof RequestError).toBe(true);
  expect(error instanceof PluginError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('RequestError with all fields', () => {
  const original = new Error('Invalid query');
  const error = new RequestError(original.message, {
    cause: original,
    typeName: 'MongoDBFind',
    received: { query: {} },
    location: 'mongodb/findUsers',
    configKey: 'key-012',
  });
  expect(error.message).toBe('Invalid query at mongodb/findUsers.');
  expect(error.typeName).toBe('MongoDBFind');
  expect(error.received).toEqual({ query: {} });
  expect(error.configKey).toBe('key-012');
});
