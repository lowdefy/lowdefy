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

import buildOneTimeTokenPlugin from './buildOneTimeTokenPlugin.js';

test('buildOneTimeTokenPlugin mints hashed one-minute tokens on the server only', () => {
  const plugin = buildOneTimeTokenPlugin();
  expect(plugin.id).toBe('one-time-token');
  expect(plugin.options).toEqual({
    expiresIn: 1,
    disableClientRequest: true,
    storeToken: 'hashed',
  });
});
