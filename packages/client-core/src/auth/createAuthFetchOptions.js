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

import { type } from '@lowdefy/helpers';

import endBearerSession from './endBearerSession.js';

// The fetchOptions a renderer passes to its Better Auth client
// (createAuthClient({ fetchOptions })), so the auth actions share the core's
// transport. A cookie host needs none. For a bearer host:
// - every Better Auth call sends the held token (Better Auth's fetchOptions.auth);
// - a response that sets the session (sign-in, a session refresh) carries the
//   token in the bearer plugin's set-auth-token header, which is kept;
// - a 401 to a call that sent a token ends the session, as on the core's own
//   routes.
function createAuthFetchOptions({ host }) {
  if (host.authTransport !== 'bearer') {
    return {};
  }
  const { tokenStore } = host;
  return {
    auth: {
      type: 'Bearer',
      // Read per call: sign-in and sign-out change it. No token, no header.
      token: () => tokenStore.get(),
    },
    onSuccess: async ({ response }) => {
      const token = response.headers.get('set-auth-token');
      if (!type.isNone(token)) {
        await tokenStore.set(token);
      }
    },
    // Whether the refused call carried a token is read from the call itself,
    // not the store: a sign-in refused while no token is held is a wrong
    // credential, not an ended session.
    onError: async ({ request, response }) => {
      if (response.status !== 401 || type.isNone(request.headers.get('authorization'))) {
        return;
      }
      await endBearerSession({
        host,
        serverCaller: response.headers.get('x-lowdefy-caller'),
      });
    },
  };
}

export default createAuthFetchOptions;
