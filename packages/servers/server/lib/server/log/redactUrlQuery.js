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

// Query parameters that carry a credential rather than a filter: the
// magic-link and reset tokens, the OAuth authorization code and signed state,
// signed-URL signatures, one-time passcodes. Matched case-insensitively.
const secretParamNames = new Set([
  'code',
  'state',
  'sig',
  'otp',
  'nonce',
  'auth',
  'apikey',
  'api_key',
  'api-key',
  'session',
  'sessionid',
  'session_id',
]);

// Names that contain one of these are credentials whatever the prefix or
// suffix - access_token, X-Amz-Signature, client_secret, X-Amz-Credential.
const secretParamFragments = ['token', 'secret', 'password', 'signature', 'credential'];

function isSecretParam(name) {
  const lower = name.toLowerCase();
  if (secretParamNames.has(lower)) {
    return true;
  }
  return secretParamFragments.some((fragment) => lower.includes(fragment));
}

// A URL fit for an access log. The query string stays - it is often what
// distinguishes one page view from the next - but the value of every
// credential-like parameter is replaced with "[redacted]". The browser echoes
// the page's full URL back as the Referer of every fetch that page makes, so
// the magic-link verify page or the OAuth consent page would otherwise write
// its token or signed state into the log store on each request. The fragment
// is dropped: a browser never sends it in a Referer, and implicit-flow tokens
// travel there. Returns undefined for a missing value. Works on relative URLs
// too, so a malformed or path-only header is still visible.
function redactUrlQuery(url) {
  if (typeof url !== 'string' || url === '') {
    return undefined;
  }
  const withoutFragment = url.split('#')[0];
  const queryStart = withoutFragment.indexOf('?');
  if (queryStart === -1) {
    return withoutFragment;
  }
  const base = withoutFragment.slice(0, queryStart);
  const params = new URLSearchParams(withoutFragment.slice(queryStart + 1));
  for (const name of params.keys()) {
    if (isSecretParam(name)) {
      params.set(name, '[redacted]');
    }
  }
  return `${base}?${params.toString()}`;
}

export default redactUrlQuery;
