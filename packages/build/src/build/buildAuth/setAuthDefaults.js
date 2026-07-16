/* eslint-disable no-param-reassign */

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

function setDefault(object, key, value) {
  if (type.isNone(object[key])) {
    object[key] = value;
  }
}

// Build writes all defaults into auth.json so the runtime never needs
// fallback defaults for build artifacts. Objects are mutated in place to
// preserve the non-enumerable ~k markers used for error locations.
function setAuthDefaults({ components }) {
  const auth = components.auth;

  // Authorization defaults apply whether or not auth is configured - the
  // page/api/agent/websocket auth build steps mark every item.
  setDefault(auth, 'agents', {});
  setDefault(auth.agents, 'roles', {});
  setDefault(auth, 'api', {});
  setDefault(auth.api, 'roles', {});
  setDefault(auth, 'pages', {});
  setDefault(auth.pages, 'roles', {});
  setDefault(auth, 'websockets', {});
  setDefault(auth.websockets, 'roles', {});
  setDefault(auth, 'providers', []);

  if (auth.configured !== true) {
    return components;
  }

  setDefault(auth, 'hooks', []);
  setDefault(auth, 'strategies', []);

  // Organizations are always on - an app that sets nothing gets one
  // auto-seeded organization (slug "default") pinned as the active org,
  // with the safe invite-only signup policy. Under "tenant" there is no
  // pinned org and signup is inherently open, so neither key defaults.
  setDefault(auth, 'organizations', {});
  setDefault(auth.organizations, 'policy', 'pinned');
  if (auth.organizations.policy === 'pinned') {
    setDefault(auth.organizations, 'org', 'default');
    setDefault(auth.organizations, 'signup', 'invite-only');
  }

  setDefault(auth, 'authPages', {});
  setDefault(auth.authPages, 'signIn', '/login');
  setDefault(auth.authPages, 'signUp', '/signup');
  setDefault(auth.authPages, 'error', '/auth/error');
  setDefault(auth.authPages, 'forgotPassword', '/forgot-password');
  setDefault(auth.authPages, 'resetPassword', '/reset-password');
  setDefault(auth.authPages, 'verifyEmail', '/verify-email');

  if (!type.isNone(auth.emailAndPassword)) {
    setDefault(auth.emailAndPassword, 'requireEmailVerification', false);
    setDefault(auth.emailAndPassword, 'minPasswordLength', 8);
    setDefault(auth.emailAndPassword, 'disableSignUp', false);
  }

  if (!type.isNone(auth.magicLink)) {
    setDefault(auth.magicLink, 'expiresIn', 300);
    setDefault(auth.magicLink, 'disableSignUp', false);
  }

  setDefault(auth, 'session', {});
  setDefault(auth.session, 'expiresIn', 604800);
  setDefault(auth.session, 'updateAge', 86400);
  setDefault(auth.session, 'cookieCache', {});
  setDefault(auth.session.cookieCache, 'enabled', false);
  setDefault(auth.session.cookieCache, 'maxAge', 300);
  setDefault(auth.session, 'crossSubDomainCookies', {});
  setDefault(auth.session.crossSubDomainCookies, 'enabled', false);

  setDefault(auth, 'account', {});
  setDefault(auth.account, 'accountLinking', {});
  setDefault(auth.account.accountLinking, 'enabled', true);
  setDefault(auth.account.accountLinking, 'trustedProviders', []);

  // Brute-force protection is on by default - the developer tunes or
  // disables it explicitly so the control is visible in config.
  setDefault(auth, 'rateLimit', {});
  setDefault(auth.rateLimit, 'enabled', true);
  setDefault(auth.rateLimit, 'window', 60);
  setDefault(auth.rateLimit, 'max', 100);

  // Presence of the twoFactor/passkey block implies intent to enable.
  if (!type.isNone(auth.twoFactor)) {
    setDefault(auth.twoFactor, 'enabled', true);
  }

  if (!type.isNone(auth.passkey)) {
    setDefault(auth.passkey, 'enabled', true);
  }

  if (!type.isNone(auth.phoneNumber)) {
    setDefault(auth.phoneNumber, 'otpLength', 6);
    setDefault(auth.phoneNumber, 'expiresIn', 300);
    setDefault(auth.phoneNumber, 'allowedAttempts', 3);
    setDefault(auth.phoneNumber, 'requireVerification', false);
  }

  return components;
}

export default setAuthDefaults;
