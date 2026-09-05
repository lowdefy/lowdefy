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

import { ConfigError } from '@lowdefy/errors';

function authNotConfigured() {
  throw new ConfigError(
    'Auth is not configured. Add an "auth" section to lowdefy.yaml to use auth actions.'
  );
}

// Every key AuthConfigured exposes must be present here, or an auth action in an
// app without an auth section fails with "auth.x is not a function" instead of
// the ConfigError that names the missing config.
function AuthNotConfigured({ authConfig, children, user = null }) {
  const auth = {
    authConfig,
    user,
    acceptInvitation: authNotConfigured,
    addPasskey: authNotConfigured,
    changePassword: authNotConfigured,
    deletePasskey: authNotConfigured,
    getResolvedUser: authNotConfigured,
    getSession: authNotConfigured,
    leaveOrganization: authNotConfigured,
    listOrganizations: authNotConfigured,
    oauth2Consent: authNotConfigured,
    oauth2Continue: authNotConfigured,
    phoneNumberRequestPasswordReset: authNotConfigured,
    phoneNumberResetPassword: authNotConfigured,
    phoneNumberSendOtp: authNotConfigured,
    phoneNumberVerify: authNotConfigured,
    refreshSession: authNotConfigured,
    requestPasswordReset: authNotConfigured,
    resetPassword: authNotConfigured,
    revokeOtherSessions: authNotConfigured,
    sendVerificationEmail: authNotConfigured,
    setActiveOrganization: authNotConfigured,
    signInEmail: authNotConfigured,
    signInMagicLink: authNotConfigured,
    signInOauth2: authNotConfigured,
    signInPasskey: authNotConfigured,
    signInPhoneNumber: authNotConfigured,
    signInSocial: authNotConfigured,
    signOut: authNotConfigured,
    signUpEmail: authNotConfigured,
    suppressSignOutReload: authNotConfigured,
    twoFactorDisable: authNotConfigured,
    twoFactorEnable: authNotConfigured,
    twoFactorGenerateBackupCodes: authNotConfigured,
    twoFactorVerifyBackupCode: authNotConfigured,
    twoFactorVerifyTotp: authNotConfigured,
    updatePasskey: authNotConfigured,
    updateResolvedUser: authNotConfigured,
  };

  return children(auth);
}

export default AuthNotConfigured;
