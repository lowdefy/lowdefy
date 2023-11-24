/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

/* eslint-disable react/jsx-props-no-spreading */

function authNotConfigured() {
  throw new Error('Auth not configured.');
}

function AuthNotConfigured({ authConfig, children }) {
  const auth = {
    authConfig,
    getSession: authNotConfigured,
    signIn: authNotConfigured,
    signOut: authNotConfigured,
  };

  return children(auth);
}

export default AuthNotConfigured;
