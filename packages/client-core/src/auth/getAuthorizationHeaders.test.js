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

import getAuthorizationHeaders from './getAuthorizationHeaders.js';

function bearerHost(token) {
  return { authTransport: 'bearer', tokenStore: { get: () => token } };
}

test('getAuthorizationHeaders gives a cookie host no header', () => {
  expect(getAuthorizationHeaders({ host: {} })).toEqual({});
  expect(getAuthorizationHeaders({ host: { authTransport: 'cookie' } })).toEqual({});
});

test('getAuthorizationHeaders gives a bearer host holding a token the bearer header', () => {
  expect(getAuthorizationHeaders({ host: bearerHost('session.signature') })).toEqual({
    Authorization: 'Bearer session.signature',
  });
});

test('getAuthorizationHeaders gives a signed-out bearer host no header', () => {
  expect(getAuthorizationHeaders({ host: bearerHost(null) })).toEqual({});
  expect(getAuthorizationHeaders({ host: bearerHost(undefined) })).toEqual({});
});

test('getAuthorizationHeaders reads the token on every call', () => {
  let token = 'first.sig';
  const host = { authTransport: 'bearer', tokenStore: { get: () => token } };
  expect(getAuthorizationHeaders({ host })).toEqual({ Authorization: 'Bearer first.sig' });
  token = 'second.sig';
  expect(getAuthorizationHeaders({ host })).toEqual({ Authorization: 'Bearer second.sig' });
});
