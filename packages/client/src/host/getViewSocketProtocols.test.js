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

import getViewSocketProtocols from './getViewSocketProtocols.js';

// What the app's server does with the second subprotocol (readViewSocketToken
// in @lowdefy/server).
function readToken(protocol) {
  return Buffer.from(protocol.slice('lowdefy.view.bearer.'.length), 'base64url').toString('utf8');
}

test('getViewSocketProtocols offers the fixed name, then the token, in that order', () => {
  const protocols = getViewSocketProtocols({ token: 'session-token.signature' });
  expect(protocols).toHaveLength(2);
  expect(protocols[0]).toBe('lowdefy.view');
  expect(protocols[1].startsWith('lowdefy.view.bearer.')).toBe(true);
  expect(readToken(protocols[1])).toBe('session-token.signature');
});

test.each([
  {
    name: 'a signed token with characters no subprotocol may carry',
    token: 'aB3/x+y=.Zm9v%2B/w==',
  },
  { name: 'a token whose base64 has + and /', token: '\u00fb\u00ff\u00fe>>>???' },
  { name: 'a token outside ASCII', token: 'sess\u00edon-\u2713' },
  { name: 'a token whose base64 would be padded', token: 'a' },
])('getViewSocketProtocols encodes $name as base64url without padding', ({ token }) => {
  const [, protocol] = getViewSocketProtocols({ token });
  const encoded = protocol.slice('lowdefy.view.bearer.'.length);
  expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(readToken(protocol)).toBe(token);
});
