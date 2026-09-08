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

import { serializer } from '@lowdefy/helpers';

import authJson from '../../build/auth.js';

// Resolves the raw mock user object — LOWDEFY_DEV_USER env var first (the
// `lowdefy dev --mock-user` flag sets it), then auth.dev.mockUser from the
// build config. Returns just the user object; getDevSession.js turns it into
// a session through the same pipeline a real sign-in uses.
function getMockUser() {
  const mockUserJson = process.env.LOWDEFY_DEV_USER;
  let mockUser;

  if (mockUserJson) {
    try {
      mockUser = JSON.parse(mockUserJson);
    } catch (error) {
      throw new Error('Invalid JSON in LOWDEFY_DEV_USER environment variable.', { cause: error });
    }
  } else {
    mockUser = authJson.dev?.mockUser;
  }

  if (!mockUser) {
    return undefined;
  }

  if (authJson.configured !== true) {
    throw new Error(
      'Mock user configured but auth is not configured in lowdefy.yaml. ' +
        'Add auth configuration to use mock user feature.'
    );
  }

  // Deserialize to restore arrays from ~arr markers and remove other build markers
  return serializer.deserialize(mockUser);
}

export default getMockUser;
