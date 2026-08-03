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

// A reimplementation of BetterAuth's two-factor plugin's own challenge-begin
// sequence, because the plugin only runs it from an after-hook whose matcher
// covers /sign-in/email, /sign-in/username and /sign-in/phone-number
// (https://github.com/better-auth/better-auth/issues/10322). Every other way
// into a session - magic link, OAuth, phone OTP - hands an enrolled user a
// session without ever asking for their second factor. There is no public
// beginTwoFactorChallenge helper to call, so the sequence is mirrored here.
//
// Delete this file, its callers and twoFactorPluginContract.test.js together
// when upstream either extends the matcher or exports a server-side helper.
//
// Everything below mirrors private plugin internals - verification identifier
// prefixes, cookie names, the attempts record - none of which is on a public
// export path, so a rename upstream is invisible to the type checker and would
// silently turn the challenge into a lie about having MFA.
// twoFactorPluginContract.test.js is the drift detector for that.

import crypto from 'node:crypto';

import { deleteSessionCookie, expireCookie } from 'better-auth/cookies';
import { generateRandomString } from 'better-auth/crypto';

// Mirrors two-factor/constant.mjs, which no public export path reaches.
const TWO_FACTOR_COOKIE_NAME = 'two_factor';
const TRUST_DEVICE_COOKIE_NAME = 'trust_device';

// The plugin's own defaults, which apply because the engine constructs
// twoFactor({ issuer, schema }) with no cookie options. Both cookies must be
// minted on the same terms the plugin's endpoints later read them on.
const TWO_FACTOR_COOKIE_MAX_AGE = 600;
const TRUST_DEVICE_MAX_AGE = 2592000;

// The trust-device cookie holds `${token}!${identifier}`, where the token binds
// the identifier to the user. @better-auth/utils' createHMAC('SHA-256',
// 'base64urlnopad') is plain HMAC-SHA256 over the UTF-8 bytes of the secret as
// a raw key, base64url without padding - so node:crypto reproduces it byte for
// byte, and the engine avoids taking a dependency on a package that is only
// reachable from inside better-auth's own node_modules under pnpm.
function signTrustDeviceToken({ secret, trustIdentifier, userId }) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}!${trustIdentifier}`, 'utf8')
    .digest('base64url');
}

// Upstream compares the cookie's token with ===. A constant-time compare costs
// nothing here and the engine should not copy a weaker comparison of a
// secret-derived value than it can write. timingSafeEqual throws on unequal
// lengths, so length is screened first - a base64url HMAC-SHA256 digest is
// fixed-length anyway, so an attacker learns nothing from that branch.
function tokensMatch(candidate, expected) {
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (candidateBytes.length !== expectedBytes.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidateBytes, expectedBytes);
}

// Returns 'trusted' when the trust-device cookie stood in for the second factor
// - the sign-in stands and the caller must leave the endpoint's own response
// alone - or 'challenged' when the session was torn down and the challenge
// records and cookie were minted, in which case the caller performs its exit.
async function beginTwoFactorChallenge({ ctx, newSession }) {
  const secret = ctx.context.secret;
  const userId = newSession.user.id;

  // Honour the trust-device cookie before tearing anything down, exactly as the
  // plugin does on the password path: a device the user already stepped up on
  // must not be challenged again just because they arrived by a different route.
  const trustCookieAttrs = ctx.context.createAuthCookie(TRUST_DEVICE_COOKIE_NAME, {
    maxAge: TRUST_DEVICE_MAX_AGE,
  });
  const trustCookie = await ctx.getSignedCookie(trustCookieAttrs.name, secret);
  if (trustCookie) {
    const [token, trustIdentifier] = trustCookie.split('!');
    if (
      token &&
      trustIdentifier &&
      tokensMatch(token, signTrustDeviceToken({ secret, trustIdentifier, userId }))
    ) {
      const record = await ctx.context.internalAdapter.findVerificationValue(trustIdentifier);
      if (record && record.value === userId && record.expiresAt > new Date()) {
        // Single-use: the record is replaced on every use, so a copied cookie
        // stops working as soon as the real device signs in again.
        await ctx.context.internalAdapter.deleteVerificationByIdentifier(trustIdentifier);
        const newTrustIdentifier = `trust-device-${generateRandomString(32)}`;
        const newToken = signTrustDeviceToken({
          secret,
          trustIdentifier: newTrustIdentifier,
          userId,
        });
        await ctx.context.internalAdapter.createVerificationValue({
          value: userId,
          identifier: newTrustIdentifier,
          expiresAt: new Date(Date.now() + TRUST_DEVICE_MAX_AGE * 1000),
        });
        await ctx.setSignedCookie(
          trustCookieAttrs.name,
          `${newToken}!${newTrustIdentifier}`,
          secret,
          trustCookieAttrs.attributes
        );
        return 'trusted';
      }
    }
    // A cookie that was presented but did not validate is stale or forged
    // either way - clear it so the browser stops replaying it, then challenge.
    expireCookie(ctx, trustCookieAttrs);
  }

  // The sign-in endpoint already minted a session and set ctx.context.newSession.
  // The second factor is still outstanding, so that session must not survive
  // this request. setNewSession(null) is what keeps downstream hooks from
  // acting on a session row that no longer exists.
  deleteSessionCookie(ctx, true);
  await ctx.context.internalAdapter.deleteSession(newSession.session.token);
  ctx.context.setNewSession(null);

  const identifier = `2fa-${generateRandomString(20)}`;
  const expiresAt = new Date(Date.now() + TWO_FACTOR_COOKIE_MAX_AGE * 1000);
  await ctx.context.internalAdapter.createVerificationValue({
    value: userId,
    identifier,
    expiresAt,
  });

  // Load-bearing, and the one that gets forgotten: beginAttempt
  // (two-factor/verify-two-factor.mjs) calls consumeVerificationValue on
  // `2fa-attempts-{identifier}` and throws INVALID_TWO_FACTOR_COOKIE when it is
  // absent. Create only the challenge record above and the challenge page
  // rejects every correct code, blaming the cookie - total failure, misleading
  // error.
  await ctx.context.internalAdapter.createVerificationValue({
    value: '0',
    identifier: `2fa-attempts-${identifier}`,
    expiresAt,
  });

  const twoFactorCookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME, {
    maxAge: TWO_FACTOR_COOKIE_MAX_AGE,
  });
  await ctx.setSignedCookie(twoFactorCookie.name, identifier, secret, twoFactorCookie.attributes);

  return 'challenged';
}

export default beginTwoFactorChallenge;
