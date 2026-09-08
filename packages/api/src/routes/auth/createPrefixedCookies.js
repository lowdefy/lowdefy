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

function slugifyPrefix(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Injects an app-specific prefix into each Auth.js cookie name so multiple apps
// on the same host do not share a cookie jar (browsers do not scope cookies by
// port). Only names are overridden — Auth.js v5 deep-merges `config.cookies`
// into its defaults, so cookie options (httpOnly, secure, maxAge) stay in sync
// with @auth/core's per-request defaults. Names mirror defaultCookies in
// @auth/core/lib/utils/cookie.js.
function createPrefixedCookies({ prefix, useSecureCookies }) {
  const securePrefix = useSecureCookies ? '__Secure-' : '';
  const hostPrefix = useSecureCookies ? '__Host-' : '';
  return {
    sessionToken: { name: `${securePrefix}${prefix}.authjs.session-token` },
    callbackUrl: { name: `${securePrefix}${prefix}.authjs.callback-url` },
    csrfToken: { name: `${hostPrefix}${prefix}.authjs.csrf-token` },
    pkceCodeVerifier: { name: `${securePrefix}${prefix}.authjs.pkce.code_verifier` },
    state: { name: `${securePrefix}${prefix}.authjs.state` },
    nonce: { name: `${securePrefix}${prefix}.authjs.nonce` },
    webauthnChallenge: { name: `${securePrefix}${prefix}.authjs.challenge` },
  };
}

export { slugifyPrefix };
export default createPrefixedCookies;
