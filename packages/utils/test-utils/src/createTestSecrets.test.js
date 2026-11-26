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

import { _secret } from '@lowdefy/operators-js/operators/server';

import createTestSecrets from './createTestSecrets.js';

test('createTestSecrets gives every named secret a stand-in that the _secret operator reads', () => {
  const secrets = createTestSecrets({ names: ['MONGODB_URI', 'API_KEY'], secrets: {} });
  expect(secrets).toEqual({
    MONGODB_URI: 'test-secret-MONGODB_URI',
    API_KEY: 'test-secret-API_KEY',
  });
  expect(_secret({ params: 'API_KEY', secrets, location: 'test' })).toEqual('test-secret-API_KEY');
});

test('createTestSecrets puts the secrets given to openTestApp over the stand-ins, and keeps ones the build does not name', () => {
  expect(
    createTestSecrets({ names: ['API_KEY', 'REGION'], secrets: { API_KEY: 'sk-test', EXTRA: 'x' } })
  ).toEqual({ API_KEY: 'sk-test', REGION: 'test-secret-REGION', EXTRA: 'x' });
});

test('createTestSecrets returns a frozen object and skips a reserved name', () => {
  const secrets = createTestSecrets({ names: ['__proto__', 'constructor', 'KEY'], secrets: {} });
  expect(Object.keys(secrets)).toEqual(['KEY']);
  expect(Object.isFrozen(secrets)).toBe(true);
});
