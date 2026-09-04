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

import AuthNotConfigured from './AuthNotConfigured.js';

function callAuthNotConfigured(props) {
  let auth;
  AuthNotConfigured({ authConfig: {}, ...props, children: (value) => (auth = value) });
  return auth;
}

test('AuthNotConfigured reports no user when the server resolved none', () => {
  expect(callAuthNotConfigured({}).user).toBe(null);
});

// An app whose only auth key is auth.dev has no auth stack, but the dev server
// still resolves auth.dev.browserUser as the caller. _user must read the same
// identity in the browser as it does on the server.
test('AuthNotConfigured reports the dev browser user the server resolved', () => {
  const user = { id: 'dev-admin', roles: ['admin'] };
  expect(callAuthNotConfigured({ user }).user).toEqual(user);
});
