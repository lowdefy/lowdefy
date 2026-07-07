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
import {
  authConfigManager,
  getSession,
  SessionProvider,
  signIn,
  signOut,
  useSession,
} from '@hono/auth-js/react';

import { serializer } from '@lowdefy/helpers';

import rawAuthConfig from 'build/auth.json';

const authConfig = serializer.deserialize(rawAuthConfig);

function authNotConfigured() {
  throw new Error('Auth not configured.');
}

function Session({ children }) {
  const wasAuthenticated = useRef(false);
  const { data: session, status } = useSession();
  wasAuthenticated.current = wasAuthenticated.current || status === 'authenticated';

  useEffect(() => {
    if (wasAuthenticated.current && status === 'unauthenticated') {
      window.location.reload();
    }
  }, [status]);

  if (status === 'loading') {
    return '';
  }
  return children(session);
}

// v1 auth is credentials-type providers via signIn(..., { redirect: false })
// — a fetch-based flow that never navigates the webview away from the bundle
// (decision 14). OAuth providers land with the BetterAuth migration.
function Auth({ apiBase, children, serverSession }) {
  if (authConfig.configured !== true) {
    const auth = {
      authConfig,
      getSession: authNotConfigured,
      signIn: authNotConfigured,
      signOut: authNotConfigured,
      session: null,
    };
    return children(auth);
  }

  // @hono/auth-js/react configures its fetch paths through a module-level
  // manager — point it at the (possibly remote) API origin.
  authConfigManager.setConfig({ basePath: `${apiBase}/api/auth` });

  const auth = { authConfig, getSession, signIn, signOut };
  return (
    <SessionProvider session={serverSession}>
      <Session>
        {(session) => {
          auth.session = session;
          return children(auth);
        }}
      </Session>
    </SessionProvider>
  );
}

export default Auth;
