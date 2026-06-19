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

// Mirrors next-auth's defaultCookies (next-auth/core/lib/cookie.js) but injects an
// app-specific prefix into each cookie name so multiple apps on the same host do not
// share a cookie jar (browsers do not scope cookies by port).
function createPrefixedCookies({ prefix, useSecureCookies }) {
  const securePrefix = useSecureCookies ? '__Secure-' : '';
  const hostPrefix = useSecureCookies ? '__Host-' : '';
  const baseOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecureCookies,
  });
  return {
    sessionToken: {
      name: `${securePrefix}${prefix}.next-auth.session-token`,
      options: baseOptions(),
    },
    callbackUrl: {
      name: `${securePrefix}${prefix}.next-auth.callback-url`,
      options: baseOptions(),
    },
    csrfToken: {
      name: `${hostPrefix}${prefix}.next-auth.csrf-token`,
      options: baseOptions(),
    },
    pkceCodeVerifier: {
      name: `${securePrefix}${prefix}.next-auth.pkce.code_verifier`,
      options: { ...baseOptions(), maxAge: 60 * 15 },
    },
    state: {
      name: `${securePrefix}${prefix}.next-auth.state`,
      options: { ...baseOptions(), maxAge: 60 * 15 },
    },
    nonce: {
      name: `${securePrefix}${prefix}.next-auth.nonce`,
      options: baseOptions(),
    },
  };
}

export { slugifyPrefix };
export default createPrefixedCookies;
