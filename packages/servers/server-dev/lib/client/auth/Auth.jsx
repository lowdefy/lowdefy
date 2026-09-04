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

import React from 'react';
import AuthConfigured from './AuthConfigured.jsx';
import AuthNotConfigured from './AuthNotConfigured.js';

import { serializer } from '@lowdefy/helpers';

// Client code imports the build JSON directly — Vite handles JSON imports;
// the lib/build/*.js wrappers are server-only (they read from disk).
// Deserialize to restore arrays from their ~arr build markers (providers
// must be a real array for provider lookups in createAuthMethods).
import rawAuthConfig from '../../../build/auth.json';

const authConfig = serializer.deserialize(rawAuthConfig);

function Auth({ children, user }) {
  if (authConfig.configured === true) {
    return (
      <AuthConfigured serverUser={user} authConfig={authConfig}>
        {(auth) => children(auth)}
      </AuthConfigured>
    );
  }
  // An app whose only auth key is auth.dev has no auth stack, but the dev
  // server still resolves a caller for auth.dev.browserUser - pass it through
  // so _user reads the same identity in the browser as on the server.
  return (
    <AuthNotConfigured authConfig={authConfig} user={user}>
      {(auth) => children(auth)}
    </AuthNotConfigured>
  );
}

export default Auth;
