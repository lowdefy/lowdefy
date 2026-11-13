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

import readViewSocketToken, {
  VIEW_SOCKET_BEARER_PREFIX,
  VIEW_SOCKET_PROTOCOL,
} from './readViewSocketToken.js';

const token = 'session-token.c2lnbmF0dXJl+/8=';
const encoded = Buffer.from(token, 'utf8').toString('base64url');

test('the subprotocol names a view offers are fixed', () => {
  expect(VIEW_SOCKET_PROTOCOL).toEqual('lowdefy.view');
  expect(VIEW_SOCKET_BEARER_PREFIX).toEqual('lowdefy.view.bearer.');
});

test('readViewSocketToken reads the bearer from the second subprotocol', () => {
  expect(readViewSocketToken({ header: `lowdefy.view, lowdefy.view.bearer.${encoded}` })).toEqual(
    token
  );
  expect(readViewSocketToken({ header: `lowdefy.view,lowdefy.view.bearer.${encoded}` })).toEqual(
    token
  );
});

test.each([
  ['no header', undefined],
  ['the fixed name alone', 'lowdefy.view'],
  ['the token alone', `lowdefy.view.bearer.${encoded}`],
  // The first subprotocol offered is the one the server answers with.
  ['the token offered first', `lowdefy.view.bearer.${encoded}, lowdefy.view`],
  ['a third subprotocol', `lowdefy.view, lowdefy.view.bearer.${encoded}, graphql-ws`],
  ['another first subprotocol', `graphql-ws, lowdefy.view.bearer.${encoded}`],
  ['an empty token', 'lowdefy.view, lowdefy.view.bearer.'],
  ['a token that is not base64url', `lowdefy.view, lowdefy.view.bearer.${token}`],
])('readViewSocketToken returns null for %s', (_, header) => {
  expect(readViewSocketToken({ header })).toBe(null);
});
