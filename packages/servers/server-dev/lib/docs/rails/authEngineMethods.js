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

// The client auth method (lowdefy._internal.auth[method], the one the engine's
// action methods call) behind each auth-engine action type, so a data-set run
// can say which action ran when it sees a method called. The action types are
// authEngineActions; authEngineMethods.test.mjs keeps the two in step.
const authEngineMethods = {
  acceptInvitation: 'AcceptInvitation',
  changePassword: 'ChangePassword',
  emailOtpSend: 'EmailOtpSend',
  emailOtpVerify: 'EmailOtpVerify',
  leaveOrganization: 'LeaveOrganization',
  listOrganizations: 'ListOrganizations',
  login: 'Login',
  logout: 'Logout',
  magicLinkVerify: 'MagicLinkVerify',
  oauth2Consent: 'OAuthConsent',
  oauth2Continue: 'OAuthContinue',
  passkeyDelete: 'PasskeyDelete',
  passkeyRegister: 'PasskeyRegister',
  passkeySignIn: 'PasskeySignIn',
  passkeyUpdate: 'PasskeyUpdate',
  phoneNumberSendOtp: 'PhoneNumberSendOtp',
  phoneNumberVerify: 'PhoneNumberVerify',
  requestPasswordReset: 'RequestPasswordReset',
  resetPassword: 'ResetPassword',
  revokeOtherSessions: 'RevokeOtherSessions',
  sendVerificationEmail: 'SendVerificationEmail',
  setActiveOrganization: 'SetActiveOrganization',
  signUp: 'SignUp',
  twoFactorDisable: 'TwoFactorDisable',
  twoFactorEnable: 'TwoFactorEnable',
  twoFactorGenerateBackupCodes: 'TwoFactorGenerateBackupCodes',
  twoFactorVerify: 'TwoFactorVerify',
  updateSession: 'UpdateSession',
};

export default authEngineMethods;
