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
import { serializer, type } from '@lowdefy/helpers';

import authJson from '../../build/auth.js';
import resolveDevUser from './resolveDevUser.js';

// The caller the developer's own browser is signed in as: a pre-resolved
// caller that substitutes for the whole resolveAuthentication step - no auth
// engine, no session lookup, no membership wall. Its roles are authoritative.
//
// One declaration of a dev caller, one selector: auth.dev.users is the map and
// auth.dev.browserUser names the entry the browser uses, resolved through the
// same resolveDevUser the headless tools use. auth.dev.mockUser is the
// deprecated v7 spelling of an anonymous entry and is removed in v9.
// LOWDEFY_DEV_USER (an inline JSON user) takes precedence over both.
//
// A dev browser user needs no auth stack behind it: auth.dev is a dev-only
// concern, so an app whose only auth key is auth.dev runs signed out in
// production and has this caller in the dev server.
function getMockUser() {
  const devUserJson = process.env.LOWDEFY_DEV_USER;
  let browserUser;

  if (devUserJson) {
    try {
      browserUser = JSON.parse(devUserJson);
    } catch (error) {
      throw new ConfigError('Invalid JSON in LOWDEFY_DEV_USER environment variable.', {
        cause: error,
      });
    }
  } else if (!type.isNone(authJson.dev?.browserUser)) {
    browserUser = resolveDevUser({ user: authJson.dev.browserUser });
  } else if (!type.isNone(authJson.dev?.mockUser)) {
    // Deserialize to restore arrays from ~arr markers and remove other build
    // markers. resolveDevUser's entries come from getDevUsers, which has
    // already done this.
    browserUser = serializer.deserialize(authJson.dev.mockUser);
  }

  if (type.isNone(browserUser)) {
    return null;
  }

  // The roles/attributes floor is applied at injection by
  // normalizeInjectedCaller (createLowdefyContext.js) - return the raw user.
  return browserUser;
}

export default getMockUser;
