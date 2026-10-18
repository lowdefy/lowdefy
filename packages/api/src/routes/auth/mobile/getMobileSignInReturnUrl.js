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

// Where the sign-in returns to the shell, with the query (the one-time token
// and state, or error=cancelled and state):
// - iOS: <scheme>://auth. ASWebAuthenticationSession hands the redirect only to
//   the app that opened it.
// - Android: the https app link <app origin><basePath>/auth/mobile/callback,
//   which Android opens only in the shell assetlinks.json names (verified
//   links), never in another app that registered the scheme. The origin is
//   the pinned canonical one (BETTER_AUTH_URL or the environment url) when
//   set, as the shell's own app url is; else the request's.
function getMobileSignInReturnUrl({ auth, params, query, url }) {
  if (params.platform === 'android') {
    const origin = auth.options?.baseURL ? new URL(auth.options.baseURL).origin : url.origin;
    return `${origin}${url.pathname}/callback?${query.toString()}`;
  }
  return `${params.shell.scheme}://auth?${query.toString()}`;
}

export default getMobileSignInReturnUrl;
