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

import { phoneNumber } from 'better-auth/plugins';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// The wire format is pinned to E.164. BetterAuth's default validator accepts
// any string, which mints several identities for one phone ("+27 83 123 4567",
// "0831234567" and "+27831234567") and spends real money on malformed sends.
// Normalization belongs in the UI's locale-aware input widgets.
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Maps auth.phoneNumber onto BetterAuth's phoneNumber plugin. The SMS send
// callbacks are the composed "phone.otp.send" / "phone.passwordReset.send"
// hook slots - build validation guarantees the OTP send binding exists when
// the plugin is enabled, so sendPhoneOtp is always a function here.
function buildPhoneNumberPlugin({
  authConfig,
  phoneVerified,
  sendPhoneOtp,
  sendPhonePasswordResetOtp,
}) {
  const phoneNumberConfig = authConfig.phoneNumber;
  const options = {
    otpLength: phoneNumberConfig.otpLength,
    expiresIn: phoneNumberConfig.expiresIn,
    allowedAttempts: phoneNumberConfig.allowedAttempts,
    requireVerification: phoneNumberConfig.requireVerification,
    phoneNumberValidator: (value) => E164_REGEX.test(value),
    sendOTP: sendPhoneOtp,
    // BetterAuth's /phone-number/request-password-reset returns
    // { status: true } without sending anything when sendPasswordResetOTP is
    // not configured - a user asking for a reset would get silence and a 200
    // in the logs. Fail loudly naming the fix instead.
    sendPasswordResetOTP:
      sendPhonePasswordResetOtp ??
      (() => {
        throw new ConfigError(
          'Password reset over phone is not configured. Bind an InternalApi endpoint to the "phone.passwordReset.send" auth hook point to send reset codes.'
        );
      }),
  };
  if (!type.isNone(phoneVerified)) {
    options.callbackOnVerification = phoneVerified;
  }
  if (!type.isNone(phoneNumberConfig.signUpOnVerification)) {
    const { tempEmailDomain } = phoneNumberConfig.signUpOnVerification;
    options.signUpOnVerification = {
      // The E.164 digits with the "+" stripped keep the derived address
      // unique per phone; uniqueness is inherited from the phone number's.
      getTempEmail: (value) => `${value.replace(/\D/g, '')}@${tempEmailDomain}`,
    };
  }
  return phoneNumber(options);
}

export default buildPhoneNumberPlugin;
