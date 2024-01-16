/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

/* eslint-disable react/jsx-props-no-spreading */

import React, { useEffect, useRef } from 'react';
import { getSession, SessionProvider, signIn, signOut, useSession } from 'next-auth/react';

import lowdefyConfig from '../../../build/config.json';

function Session({ children }) {
  const wasAuthenticated = useRef(false);
  const { data: session, status } = useSession();
  wasAuthenticated.current = wasAuthenticated.current || status === 'authenticated';

  useEffect(() => {
    if (wasAuthenticated.current && status === 'unauthenticated') {
      window.location.reload();
    }
  }, [status]);

  // If session is passed to SessionProvider from getServerSideProps
  // we won't have a loading state here.
  // But 404 uses getStaticProps so we have this for 404.
  if (status === 'loading') {
    return '';
  }
  return children(session);
}

function AuthConfigured({ authConfig, children, serverSession }) {
  const auth = { authConfig, getSession, signIn, signOut };
  let basePath = lowdefyConfig.basePath;
  if (basePath) {
    basePath = `${basePath}/api/auth`;
  }
  return (
    <SessionProvider session={serverSession} basePath={basePath}>
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
