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

import isRebindingSafeHost from './isRebindingSafeHost.js';

test.each([
  ['localhost:4100', true],
  ['LOCALHOST', true],
  ['app.localhost:4100', true],
  ['127.0.0.1:4100', true],
  ['192.168.1.20', true],
  ['[::1]:4100', true],
  [undefined, true],
  ['rebound.test:4100', false],
  ['localhost.rebound.test', false],
  ['127.0.0.1.rebound.test', false],
])('isRebindingSafeHost(%s) is %s', (host, expected) => {
  expect(isRebindingSafeHost({ host })).toBe(expected);
});
