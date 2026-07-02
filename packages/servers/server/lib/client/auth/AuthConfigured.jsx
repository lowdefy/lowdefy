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
import {
  genericOAuthClient,
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins';

import { serializer } from '@lowdefy/helpers';

import rawLowdefyConfig from '../../../build/config.json';

const lowdefyConfig = serializer.deserialize(rawLowdefyConfig);

const authClient = createAuthClient({
  baseURL: `${window.location.origin}${lowdefyConfig.basePath ?? ''}/api/auth`,
  plugins: [genericOAuthClient(), magicLinkClient(), organizationClient()],
});

// The server resolves the caller per request and embeds it in the page
// config, so the first render never flashes unauthenticated. The BetterAuth
// client store takes over once its session fetch settles.
//
// Roles and merged attributes resolve server-side from the active member row
// - the base session carries neither. The last server-resolved caller is
// kept in a ref: while the session user is unchanged its roles and
// attributes stay authoritative, and UpdateSession refreshes the ref from
// /api/user after a change (e.g. SetActiveOrganization).
function Session({ children, serverUser }) {
  const { data: session, isPending } = authClient.useSession();
  const resolvedUserRef = useRef(serverUser);
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
    return children(resolvedUserRef.current, resolvedUserRef);
  }
  if (!session?.user) {
    return children(null, resolvedUserRef);
  }
  const resolved = resolvedUserRef.current;
  const user =
    resolved && resolved.id === session.user.id
      ? { ...session.user, roles: resolved.roles, attributes: resolved.attributes }
      : { roles: [], ...session.user };
  return children(user, resolvedUserRef);
}

function AuthConfigured({ authConfig, children, serverUser }) {
  const auth = {
    authConfig,
    getSession: ({ disableCookieCache } = {}) =>
      authClient.getSession(disableCookieCache ? { query: { disableCookieCache: true } } : {}),
    // The server-resolved caller - roles from the active member row and the
    // merged attributes bag - for re-syncing after session changes.
    getResolvedUser: async () => {
      const response = await fetch(`${lowdefyConfig.basePath ?? ''}/api/user`, {
        credentials: 'same-origin',
      });
      return response.json();
    },
    setActiveOrganization: (params) => authClient.organization.setActive(params),
    signInEmail: (params) => authClient.signIn.email(params),
    signInMagicLink: (params) => authClient.signIn.magicLink(params),
    signInOauth2: (params) => authClient.signIn.oauth2(params),
    signInSocial: (params) => authClient.signIn.social(params),
    signOut: () => authClient.signOut(),
    signUpEmail: (params) => authClient.signUp.email(params),
  };
  return (
    <Session serverUser={serverUser}>
      {(user, resolvedUserRef) => {
        auth.user = user;
        auth.updateResolvedUser = (resolved) => {
          resolvedUserRef.current = resolved;
        };
        return children(auth);
      }}
    </Session>
  );
}

export default AuthConfigured;
