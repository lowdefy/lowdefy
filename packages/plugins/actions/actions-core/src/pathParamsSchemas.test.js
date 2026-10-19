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

import { validate } from '@lowdefy/ajv';

import EmailOtpVerify from './actions/EmailOtpVerify/schema.js';
import Link from './actions/Link/schema.js';
import Login from './actions/Login/schema.js';
import Logout from './actions/Logout/schema.js';
import MagicLinkVerify from './actions/MagicLinkVerify/schema.js';
import PasskeySignIn from './actions/PasskeySignIn/schema.js';
import PhoneNumberVerify from './actions/PhoneNumberVerify/schema.js';
import SendVerificationEmail from './actions/SendVerificationEmail/schema.js';
import SignUp from './actions/SignUp/schema.js';
import TwoFactorVerify from './actions/TwoFactorVerify/schema.js';

const schemas = {
  EmailOtpVerify,
  Link,
  Login,
  Logout,
  MagicLinkVerify,
  PasskeySignIn,
  PhoneNumberVerify,
  SendVerificationEmail,
  SignUp,
  TwoFactorVerify,
};

const target = { pageId: 'ticket', pathParams: { space: 'support', ticket_id: '1234' } };
const badTarget = { pageId: 'ticket', pathParams: 'support/1234' };

// Each navigation target an action takes, as params holding that target.
const cases = [
  ['Link', 'Link', (t) => t],
  ['Login callbackUrl', 'Login', (t) => ({ callbackUrl: t })],
  ['Login newUserCallbackUrl', 'Login', (t) => ({ newUserCallbackUrl: t })],
  ['Login errorCallbackUrl', 'Login', (t) => ({ errorCallbackUrl: t })],
  ['Logout', 'Logout', (t) => ({ callbackUrl: t })],
  ['SignUp', 'SignUp', (t) => ({ callbackUrl: t })],
  ['EmailOtpVerify', 'EmailOtpVerify', (t) => ({ email: 'a@b.c', otp: '123456', callbackUrl: t })],
  ['MagicLinkVerify callbackUrl', 'MagicLinkVerify', (t) => ({ callbackUrl: t })],
  ['MagicLinkVerify newUserCallbackUrl', 'MagicLinkVerify', (t) => ({ newUserCallbackUrl: t })],
  ['MagicLinkVerify errorCallbackUrl', 'MagicLinkVerify', (t) => ({ errorCallbackUrl: t })],
  [
    'PhoneNumberVerify',
    'PhoneNumberVerify',
    (t) => ({ phoneNumber: '+27820000000', code: '123456', callbackUrl: t }),
  ],
  ['TwoFactorVerify', 'TwoFactorVerify', (t) => ({ code: '123456', callbackUrl: t })],
  ['SendVerificationEmail', 'SendVerificationEmail', (t) => ({ email: 'a@b.c', callbackUrl: t })],
  ['PasskeySignIn', 'PasskeySignIn', (t) => ({ callbackUrl: t })],
];

test.each(cases)('%s accepts pathParams on its target', (_, action, toParams) => {
  const schema = schemas[action].params;
  expect(validate({ schema, data: toParams(target) })).toEqual({ valid: true });
});

test.each(cases)('%s refuses pathParams that is not an object', (_, action, toParams) => {
  const schema = schemas[action].params;
  expect(validate({ schema, data: toParams(badTarget), returnErrors: true }).valid).toBe(false);
});
