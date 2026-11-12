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

// Actions that only a browser can carry out, by type: the auth family, which signs in through the
// auth server's browser flows (a headless journey's user is injected instead), and the actions
// that use a browser API (the clipboard, focus, scrolling, geolocation, the colour scheme, the
// locale, downloads). A headless page fails on one with a message that names it, which marks the
// journey browser-only at run time; a journey's steps alone cannot show that it reaches one.
const browserOnlyActions = new Set([
  'AcceptInvitation',
  'ChangePassword',
  'CopyToClipboard',
  'EmailOtpSend',
  'EmailOtpVerify',
  'GeolocationCurrentPosition',
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
  'PdfMake',
  'PhoneNumberSendOtp',
  'PhoneNumberVerify',
  'RequestPasswordReset',
  'ResetPassword',
  'RevokeOtherSessions',
  'ScrollTo',
  'SendVerificationEmail',
  'SetActiveOrganization',
  'SetDarkMode',
  'SetFocus',
  'SetLocale',
  'SignUp',
  'TwoFactorDisable',
  'TwoFactorEnable',
  'TwoFactorGenerateBackupCodes',
  'TwoFactorVerify',
  'UpdateSession',
]);

export default browserOnlyActions;
