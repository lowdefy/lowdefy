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

import { jest } from '@jest/globals';

import validateAuthTransport from './validateAuthTransport.js';

function createTokenStore() {
  return { get: jest.fn(() => null), set: jest.fn(), clear: jest.fn() };
}

test('validateAuthTransport accepts a host that names no authTransport, as the web host', () => {
  expect(() => validateAuthTransport({ host: {} })).not.toThrow();
});

test('validateAuthTransport accepts a cookie host without a tokenStore', () => {
  expect(() => validateAuthTransport({ host: { authTransport: 'cookie' } })).not.toThrow();
});

test('validateAuthTransport accepts a bearer host with a tokenStore', () => {
  expect(() =>
    validateAuthTransport({ host: { authTransport: 'bearer', tokenStore: createTokenStore() } })
  ).not.toThrow();
});

test('validateAuthTransport throws for an unknown authTransport, naming the value', () => {
  expect(() => validateAuthTransport({ host: { authTransport: 'token' } })).toThrow(
    'Lowdefy client host authTransport must be "cookie" or "bearer". Received "token".'
  );
});

test('validateAuthTransport throws for a bearer host with no tokenStore', () => {
  expect(() => validateAuthTransport({ host: { authTransport: 'bearer' } })).toThrow(
    'Lowdefy client host with authTransport "bearer" needs a tokenStore with get, set, clear.'
  );
});

test('validateAuthTransport names the tokenStore methods a bearer host lacks', () => {
  expect(() =>
    validateAuthTransport({
      host: { authTransport: 'bearer', tokenStore: { get: () => null, set: () => undefined } },
    })
  ).toThrow('Lowdefy client host with authTransport "bearer" needs a tokenStore with clear.');
});
