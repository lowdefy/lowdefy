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

import lowdefyConfig from '../../../build/config.json';

// @hono/auth-js/react configures its fetch paths through a module-level
// manager instead of SessionProvider props.
if (lowdefyConfig.basePath) {
  authConfigManager.setConfig({ basePath: `${lowdefyConfig.basePath}/api/auth` });
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

  // If session is passed to SessionProvider from the server-rendered config
  // we won't have a loading state here, but unauthenticated first loads do.
  if (status === 'loading') {
    return '';
  }
  return children(session);
}

function AuthConfigured({ authConfig, children, serverSession }) {
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

export default AuthConfigured;
