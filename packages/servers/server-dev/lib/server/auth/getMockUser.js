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

import { ConfigError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import authJson from '../../build/auth.js';

// dev.mockUser is a pre-resolved caller that substitutes for the whole
// resolveAuthentication step - no auth engine, no session lookup, no
// membership wall. Its roles are authoritative. LOWDEFY_DEV_USER takes
// priority over auth.dev.mockUser from lowdefy.yaml.
//
// A dev mock user needs no auth stack behind it: auth.dev is a dev-only
// concern, so an app whose only auth key is auth.dev runs signed out in
// production and has this caller in the dev server.
function getMockUser() {
  const mockUserJson = process.env.LOWDEFY_DEV_USER;
  let mockUser;

  if (mockUserJson) {
    try {
      mockUser = JSON.parse(mockUserJson);
    } catch (error) {
      throw new ConfigError('Invalid JSON in LOWDEFY_DEV_USER environment variable.', {
        cause: error,
      });
    }
  } else {
    mockUser = authJson.dev?.mockUser;
  }

  if (!mockUser) {
    return null;
  }

  // Deserialize to restore arrays from ~arr markers and remove other build markers
  mockUser = serializer.deserialize(mockUser);

  // The roles/attributes floor is applied at injection by
  // normalizeInjectedCaller (createLowdefyContext.js) - return the raw user.
  return mockUser;
}

export default getMockUser;
