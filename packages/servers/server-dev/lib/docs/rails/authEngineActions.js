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

// The actions-core action types that call the auth engine. A data-set journey
// acts as an injected caller, which has no auth engine session, so these fail
// every time for a harness reason, not the app's: a click that runs one is
// refused (see createDataSetRails). A new actions-core action must be
// classified here or in the test's list of the rest.
const authEngineActions = new Set([
  'AcceptInvitation',
  'ChangePassword',
  'EmailOtpSend',
  'EmailOtpVerify',
  'LeaveOrganization',
  'ListOrganizations',
  'Login',
  'Logout',
  'MagicLinkVerify',
  'OAuthConsent',
  'OAuthContinue',
  'PasskeyDelete',
  'PasskeyRegister',
  'PasskeySignIn',
  'PasskeyUpdate',
  'PhoneNumberSendOtp',
  'PhoneNumberVerify',
  'RequestPasswordReset',
  'ResetPassword',
  'RevokeOtherSessions',
  'SendVerificationEmail',
  'SetActiveOrganization',
  'SignUp',
  'TwoFactorDisable',
  'TwoFactorEnable',
  'TwoFactorGenerateBackupCodes',
  'TwoFactorVerify',
  'UpdateSession',
]);

export default authEngineActions;
