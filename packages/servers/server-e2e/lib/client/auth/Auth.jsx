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

import { serializer } from '@lowdefy/helpers';

import rawAuthConfig from '../../../build/auth.json';

const authConfig = serializer.deserialize(rawAuthConfig);

function e2eNotSupported() {
  throw new Error('Sign-in and sign-out are not supported in e2e testing.');
}

function Auth({ children, user }) {
  const auth = {
    authConfig,
    user,
    // Matches the BetterAuth client contract: { data, error }.
    getSession: async () => {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        return { data: await res.json(), error: null };
      }
      return { data: null, error: null };
    },
    getResolvedUser: async () => {
      const res = await fetch('/api/user');
      if (res.ok) {
        return res.json();
      }
      return { user: null };
    },
    acceptInvitation: e2eNotSupported,
    addPasskey: e2eNotSupported,
    changePassword: e2eNotSupported,
    deletePasskey: e2eNotSupported,
    updatePasskey: e2eNotSupported,
    requestPasswordReset: e2eNotSupported,
    resetPassword: e2eNotSupported,
    revokeOtherSessions: e2eNotSupported,
    sendVerificationEmail: e2eNotSupported,
    setActiveOrganization: e2eNotSupported,
    signInEmail: e2eNotSupported,
    signInMagicLink: e2eNotSupported,
    signInOauth2: e2eNotSupported,
    signInSocial: e2eNotSupported,
    signOut: e2eNotSupported,
    signUpEmail: e2eNotSupported,
    twoFactorDisable: e2eNotSupported,
    twoFactorEnable: e2eNotSupported,
    twoFactorGenerateBackupCodes: e2eNotSupported,
    twoFactorVerifyBackupCode: e2eNotSupported,
    twoFactorVerifyTotp: e2eNotSupported,
  };
  return children(auth);
}

export default Auth;
