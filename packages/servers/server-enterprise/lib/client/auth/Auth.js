/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import AuthConfigured from './AuthConfigured.js';
import AuthNotConfigured from './AuthNotConfigured.js';

import authConfig from '../../../build/auth.json';

function Auth({ children, session }) {
  if (authConfig.configured === true) {
    return (
      <AuthConfigured serverSession={session} authConfig={authConfig}>
        {(auth) => children(auth)}
      </AuthConfigured>
    );
  }
  return <AuthNotConfigured authConfig={authConfig}>{(auth) => children(auth)}</AuthNotConfigured>;
}

export default Auth;
