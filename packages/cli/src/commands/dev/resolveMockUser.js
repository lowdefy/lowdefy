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

// BetterAuth's session user carries `id`, never `sub`. The roles/attributes
// floor happens at injection via normalizeInjectedCaller (server-dev), so only
// an explicit, readable roles default is kept here.
const defaultMockUser = {
  id: 'lowdefy-dev',
  name: 'Lowdefy Dev User',
  roles: [],
};

// Turns the `--mock-user [user]` CLI option into the JSON string the dev server
// reads from LOWDEFY_DEV_USER. Bare flag (commander yields `true`) → a default
// roleless user. A supplied value is validated here so an invalid `--mock-user`
// fails at the CLI with a clear message instead of deep in the server runtime.
function resolveMockUser(mockUser) {
  if (mockUser === true) {
    return JSON.stringify(defaultMockUser);
  }
  try {
    return JSON.stringify(JSON.parse(mockUser));
  } catch (error) {
    throw new Error(
      `Invalid --mock-user value. Expected a JSON user object, received ${JSON.stringify(
        mockUser
      )}.`,
      { cause: error }
    );
  }
}

export default resolveMockUser;
