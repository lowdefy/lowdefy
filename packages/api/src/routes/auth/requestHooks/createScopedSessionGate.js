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

import { APIError, getSessionFromCtx } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// The only auth routes a scoped session may call. Everything here either reads
// the session, ends it, or starts an ordinary sign-in that proves a credential
// of its own - none acts through the session's authority. Every other route is
// session-bound (add a passkey, enrol a second factor, consent an MCP grant,
// change the email or password, link an account, set the active organization,
// verify a phone number) and would hand a link in an inbox a lasting hold on the
// account, so it is refused while the session carries a scope.
const ALLOWED_PATHS = new Set([
  '/get-session',
  '/sign-out',
  '/sign-in-token/exchange',
  '/magic-link/verify',
  '/email-otp/send-verification-otp',
  '/passkey/generate-authenticate-options',
  '/passkey/verify-authentication',
  '/two-factor/verify-totp',
  '/two-factor/verify-backup-code',
  '/request-password-reset',
  '/reset-password',
  '/send-verification-email',
  '/verify-email',
  '/email-otp/request-password-reset',
  '/email-otp/reset-password',
  '/forget-password/email-otp',
  '/phone-number/send-otp',
  '/phone-number/request-password-reset',
  '/phone-number/reset-password',
]);

// Phone-number verify signs in by a one-time code, unless it is asked to put
// the number on the session's own user (updatePhoneNumber) - that one acts
// through the session.
function isPhoneSignIn(path, ctx) {
  return path === '/phone-number/verify' && ctx.body?.updatePhoneNumber !== true;
}

const ALLOWED_PREFIXES = ['/sign-in/', '/sign-up/', '/callback/', '/reset-password/'];

function isAllowedPath(path) {
  return ALLOWED_PATHS.has(path) || ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// Only an HTTP request is gated. A server-side auth.api call has no request, and
// the engine's own calls - resolving the caller, the auth steps - pass headers
// of the caller they act for; those callers are limited where they are
// resolved (resolveAuthentication, handleAuthStep), not here. A serverOnly
// endpoint has no path.
function matchesScopedSessionGate(path, ctx) {
  return (
    type.isString(path) &&
    !type.isNone(ctx.request) &&
    !isAllowedPath(path) &&
    !isPhoneSignIn(path, ctx)
  );
}

function createScopedSessionGate() {
  return async function scopedSessionGate(ctx) {
    const session = await getSessionFromCtx(ctx);
    if (type.isNone(session?.session?.sessionScope)) {
      return undefined;
    }
    throw new APIError('FORBIDDEN', {
      code: 'SCOPED_SESSION',
      message:
        'This session was opened from an emailed link and can not do that. Sign in to continue.',
    });
  };
}

export default createScopedSessionGate;
export { isAllowedPath, matchesScopedSessionGate };
