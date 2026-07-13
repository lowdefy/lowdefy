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

import { jest } from '@jest/globals';

import buildPhoneNumberPlugin from './buildPhoneNumberPlugin.js';

function createAuthConfig(overrides = {}) {
  return {
    phoneNumber: {
      enabled: true,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      requireVerification: false,
      ...overrides,
    },
  };
}

const sendPhoneOtp = jest.fn();

test('buildPhoneNumberPlugin returns the phone-number plugin with scalar options from config', () => {
  const plugin = buildPhoneNumberPlugin({
    authConfig: createAuthConfig({ otpLength: 8, expiresIn: 120, allowedAttempts: 5 }),
    sendPhoneOtp,
  });
  expect(plugin.id).toBe('phone-number');
  expect(plugin.options.otpLength).toBe(8);
  expect(plugin.options.expiresIn).toBe(120);
  expect(plugin.options.allowedAttempts).toBe(5);
  expect(plugin.options.requireVerification).toBe(false);
  expect(plugin.options.sendOTP).toBe(sendPhoneOtp);
});

test('buildPhoneNumberPlugin pins the E.164 phone number validator', () => {
  const plugin = buildPhoneNumberPlugin({ authConfig: createAuthConfig(), sendPhoneOtp });
  const { phoneNumberValidator } = plugin.options;
  expect(phoneNumberValidator('+27831234567')).toBe(true);
  expect(phoneNumberValidator('+14155552671')).toBe(true);
  // One canonical wire format - spaced, local and zero-prefixed forms would
  // mint distinct identities for one phone.
  expect(phoneNumberValidator('+27 83 123 4567')).toBe(false);
  expect(phoneNumberValidator('0831234567')).toBe(false);
  expect(phoneNumberValidator('+0831234567')).toBe(false);
  expect(phoneNumberValidator('27831234567')).toBe(false);
  expect(phoneNumberValidator('+2783123456789012345')).toBe(false);
});

test('buildPhoneNumberPlugin wires the bound sendPasswordResetOTP slot', () => {
  const sendPhonePasswordResetOtp = jest.fn();
  const plugin = buildPhoneNumberPlugin({
    authConfig: createAuthConfig(),
    sendPhoneOtp,
    sendPhonePasswordResetOtp,
  });
  expect(plugin.options.sendPasswordResetOTP).toBe(sendPhonePasswordResetOtp);
});

test('buildPhoneNumberPlugin throws a naming error from sendPasswordResetOTP when unbound', () => {
  const plugin = buildPhoneNumberPlugin({ authConfig: createAuthConfig(), sendPhoneOtp });
  // BetterAuth would silently return { status: true } without a configured
  // sender - the thrower converts silence into an error naming the binding.
  expect(() =>
    plugin.options.sendPasswordResetOTP({ phoneNumber: '+27831234567', code: '123456' })
  ).toThrow(
    'Password reset over phone is not configured. Bind an InternalApi endpoint to the "phone.passwordReset.send" auth hook point to send reset codes.'
  );
});

test('buildPhoneNumberPlugin sets callbackOnVerification only when phone.verified is bound', () => {
  const phoneVerified = jest.fn();
  const withCallback = buildPhoneNumberPlugin({
    authConfig: createAuthConfig(),
    phoneVerified,
    sendPhoneOtp,
  });
  expect(withCallback.options.callbackOnVerification).toBe(phoneVerified);

  const withoutCallback = buildPhoneNumberPlugin({
    authConfig: createAuthConfig(),
    sendPhoneOtp,
  });
  expect(withoutCallback.options.callbackOnVerification).toBeUndefined();
});

test('buildPhoneNumberPlugin derives temp emails from the E.164 digits and configured domain', () => {
  const plugin = buildPhoneNumberPlugin({
    authConfig: createAuthConfig({
      signUpOnVerification: { tempEmailDomain: 'phone.example.com' },
    }),
    sendPhoneOtp,
  });
  expect(plugin.options.signUpOnVerification.getTempEmail('+27831234567')).toBe(
    '27831234567@phone.example.com'
  );
});

test('buildPhoneNumberPlugin omits signUpOnVerification when not configured', () => {
  const plugin = buildPhoneNumberPlugin({ authConfig: createAuthConfig(), sendPhoneOtp });
  expect(plugin.options.signUpOnVerification).toBeUndefined();
});
