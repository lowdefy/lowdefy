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

import isLoopbackHost from './isLoopbackHost.js';

test.each(['localhost', 'LOCALHOST', 'app.localhost', '127.0.0.1', '127.5.0.9', '::1', '[::1]'])(
  'isLoopbackHost accepts %s',
  (host) => {
    expect(isLoopbackHost(host)).toBe(true);
  }
);

test.each([
  '0.0.0.0',
  '192.168.1.20',
  '10.0.0.4',
  'calm-otter-42.ngrok.app',
  'localhost.attacker.com',
  '',
  undefined,
])('isLoopbackHost refuses %s', (host) => {
  expect(isLoopbackHost(host)).toBe(false);
});
