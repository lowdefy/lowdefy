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

/* eslint-disable react/jsx-props-no-spreading */

import React, { useEffect, useRef } from 'react';
import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient, magicLinkClient } from 'better-auth/client/plugins';

import { serializer } from '@lowdefy/helpers';

import rawLowdefyConfig from '../../../build/config.json';

const lowdefyConfig = serializer.deserialize(rawLowdefyConfig);

const authClient = createAuthClient({
  baseURL: `${window.location.origin}${lowdefyConfig.basePath ?? ''}/api/auth`,
  plugins: [genericOAuthClient(), magicLinkClient()],
});

// The server resolves the caller per request and embeds it in the page
// config, so the first render never flashes unauthenticated. The BetterAuth
// client store takes over once its session fetch settles.
function Session({ children, serverUser }) {
  const { data: session, isPending } = authClient.useSession();
  const wasAuthenticated = useRef(Boolean(serverUser));

  useEffect(() => {
    if (session) {
      wasAuthenticated.current = true;
    }
    // Reload after sign-out (or session revocation) so the server can apply
    // the page auth fork - a protected page redirects to the login page.
    if (wasAuthenticated.current && !isPending && !session) {
      window.location.reload();
    }
  }, [session, isPending]);

  if (isPending) {
    return children(serverUser);
  }
  // Roles resolve server-side; the base session carries none.
  return children(session?.user ? { roles: [], ...session.user } : null);
}

function AuthConfigured({ authConfig, children, serverUser }) {
  const auth = {
    authConfig,
    getSession: ({ disableCookieCache } = {}) =>
      authClient.getSession(disableCookieCache ? { query: { disableCookieCache: true } } : {}),
    signInEmail: (params) => authClient.signIn.email(params),
    signInMagicLink: (params) => authClient.signIn.magicLink(params),
    signInOauth2: (params) => authClient.signIn.oauth2(params),
    signInSocial: (params) => authClient.signIn.social(params),
    signOut: () => authClient.signOut(),
    signUpEmail: (params) => authClient.signUp.email(params),
  };
  return (
    <Session serverUser={serverUser}>
      {(user) => {
        auth.user = user;
        return children(auth);
      }}
    </Session>
  );
}

export default AuthConfigured;
