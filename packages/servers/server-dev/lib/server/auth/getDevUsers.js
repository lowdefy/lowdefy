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

import { serializer, type } from '@lowdefy/helpers';

import authJson from '../../build/auth.js';

// auth.dev.users names callers for the dev server's headless tools. Unlike
// dev.mockUser it does not bypass login for the developer's own browser, so it
// does not require auth to be configured - a fixture only names who a headless
// tool call acts as.
let devUsers;

function getDevUsers() {
  if (type.isNone(devUsers)) {
    // Deserialize to restore arrays from ~arr markers and remove other build
    // markers, the same way getMockUser does for dev.mockUser.
    devUsers = serializer.deserialize(authJson.dev?.users) ?? {};
  }
  return devUsers;
}

export default getDevUsers;
