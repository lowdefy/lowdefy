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

import getWebSocketSources from './getWebSocketSources.js';

test.each([
  ['https://app.example.com/page', ['wss://app.example.com']],
  ['https://app.example.com:8443/', ['wss://app.example.com:8443']],
  ['http://localhost:3122/', ['ws://localhost:3122', 'wss://localhost:3122']],
  ['http://127.0.0.1:3122/', ['ws://127.0.0.1:3122', 'wss://127.0.0.1:3122']],
  ['http://[::1]:3122/', ['ws://[::1]:3122', 'wss://[::1]:3122']],
])('getWebSocketSources for %s returns %j', (requestUrl, expected) => {
  expect(getWebSocketSources({ requestUrl })).toEqual(expected);
});

test('getWebSocketSources returns no source for a host with characters outside a hostname', () => {
  expect(getWebSocketSources({ requestUrl: "https://app.example.com';x/" })).toEqual([]);
});
