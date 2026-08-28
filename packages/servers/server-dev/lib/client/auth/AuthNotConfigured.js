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

function authNotConfigured() {
  throw new Error('Auth not configured.');
}

function AuthNotConfigured({ authConfig, children }) {
  const auth = {
    authConfig,
    user: null,
    acceptInvitation: authNotConfigured,
    addPasskey: authNotConfigured,
    changePassword: authNotConfigured,
    deletePasskey: authNotConfigured,
    updatePasskey: authNotConfigured,
    getResolvedUser: authNotConfigured,
    getSession: authNotConfigured,
    leaveOrganization: authNotConfigured,
    requestPasswordReset: authNotConfigured,
    resetPassword: authNotConfigured,
    revokeOtherSessions: authNotConfigured,
    sendVerificationEmail: authNotConfigured,
    setActiveOrganization: authNotConfigured,
    signInEmail: authNotConfigured,
    signInMagicLink: authNotConfigured,
    signInOauth2: authNotConfigured,
    signInSocial: authNotConfigured,
    signOut: authNotConfigured,
    signUpEmail: authNotConfigured,
    twoFactorDisable: authNotConfigured,
    twoFactorEnable: authNotConfigured,
    twoFactorGenerateBackupCodes: authNotConfigured,
    twoFactorVerifyBackupCode: authNotConfigured,
    twoFactorVerifyTotp: authNotConfigured,
  };

  return children(auth);
}

export default AuthNotConfigured;
