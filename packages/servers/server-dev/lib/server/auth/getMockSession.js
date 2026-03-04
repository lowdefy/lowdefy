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

import { createSessionCallback } from '@lowdefy/api';
import { serializer } from '@lowdefy/helpers';

import authJson from '../../build/auth.js';
import callbacks from '../../../build/plugins/auth/callbacks.js';

async function getMockSession() {
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

  // Deserialize to restore arrays from ~arr markers and remove other build markers
  mockUser = serializer.deserialize(mockUser);

  if (authJson.configured !== true) {
    throw new Error(
      'Mock user configured but auth is not configured in lowdefy.yaml. ' +
        'Add auth configuration to use mock user feature.'
    );
  }

  // Create session callback to transform mock user
  const sessionCallback = createSessionCallback({
    authConfig: authJson,
    plugins: { callbacks },
  });

  // Transform mock user through session callback (mock user acts as token)
  const session = await sessionCallback({
    session: { user: {} },
    token: mockUser,
    user: mockUser,
  });

  return session;
}

export default getMockSession;
