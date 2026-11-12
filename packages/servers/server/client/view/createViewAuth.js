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
import { type } from '@lowdefy/helpers';

import AuthNotConfigured from '../../lib/client/auth/AuthNotConfigured.js';

function authNotInView() {
  throw new ConfigError(
    'Auth actions are not available in an MCP App view. The view is signed in by its host.'
  );
}

// The auth object of a page shown as an MCP App view. The caller is the person
// the view's session was minted for, read from /api/user, and nothing on the
// page can change the session: it has no cookie, and the auth client is not
// loaded. Every auth method throws. The method names come from
// AuthNotConfigured, which lists every key the browser's auth object has, so a
// method added there is covered here.
function createViewAuth({ authConfig, user }) {
  const auth = AuthNotConfigured({ authConfig, children: (value) => value, user });
  Object.keys(auth).forEach((key) => {
    if (type.isFunction(auth[key])) {
      auth[key] = authNotInView;
    }
  });
  return auth;
}

export default createViewAuth;
