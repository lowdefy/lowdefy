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

import { captcha } from 'better-auth/plugins';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// The protected set is computed from the enabled login methods - the union
// of each method's public initiate endpoints, including the message-send
// endpoints that spend money. This deliberately deviates from BetterAuth's
// static default (three email paths), which would leave
// /phone-number/send-otp - the most expensive endpoint and the reason this
// plugin exists - unprotected. Verify/consume endpoints stay uncovered: they
// are guarded by their own single-use, attempt-limited codes, and captcha
// tokens are single-use, so covering them would demand a second token per
// flow.
function computeCaptchaEndpoints({ authConfig }) {
  const endpoints = [
    '/sign-up/email',
    '/sign-in/email',
    '/request-password-reset',
    '/send-verification-email',
  ];
  if (authConfig.magicLink?.enabled === true) {
    endpoints.push('/sign-in/magic-link');
  }
  if (authConfig.phoneNumber?.enabled === true) {
    endpoints.push(
      '/phone-number/send-otp',
      '/sign-in/phone-number',
      '/phone-number/request-password-reset'
    );
  }
  return endpoints;
}

// Maps auth.captcha onto BetterAuth's captcha plugin - a self-contained
// onRequest middleware that verifies the x-captcha-response header against
// the provider's siteverify API and fails closed. An explicit
// auth.captcha.endpoints replaces the computed set entirely.
function buildCaptchaPlugin({ authConfig }) {
  const captchaConfig = authConfig.captcha;
  if (!type.isString(captchaConfig.secretKey)) {
    throw new ConfigError(
      'Auth "captcha.secretKey" did not resolve to a string. Check the _secret operator reference and that the secret is set.',
      { received: type.typeOf(captchaConfig.secretKey) }
    );
  }
  return captcha({
    provider: captchaConfig.provider,
    secretKey: captchaConfig.secretKey,
    endpoints: captchaConfig.endpoints ?? computeCaptchaEndpoints({ authConfig }),
  });
}

export default buildCaptchaPlugin;
