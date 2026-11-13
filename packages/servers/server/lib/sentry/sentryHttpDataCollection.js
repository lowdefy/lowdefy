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

// Header and query parameter names that carry the client's address or identity, by substring.
// Sentry already filters names holding auth, token, session, key, cookie and similar.
const identifyingNames = ['forwarded', '-ip', 'remote-', 'via', '-user'];

// The previous page's URL (in the browser, document.referrer, sent as the Referer header of each
// event and page span), whose query can carry a password-reset or sign-in link's token under a
// name Sentry does not filter. Sentry matches by substring, and neither spelling contains the
// other.
const refererNames = ['referer', 'referrer'];

// What both the browser and the server SDK collect about a request, pinned to what Sentry 10
// sent with sendDefaultPii off, except cookies, which Sentry 10 attached to server error events
// and Lowdefy now keeps off: Sentry 11 defaults to sending cookies (the session cookie among
// them), request and response bodies, and the user's IP address. The server adds what only it
// collects (lib/server/sentry/sentryDataCollection).
const sentryHttpDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { deny: [...identifyingNames, ...refererNames] },
  httpBodies: [],
  urlQueryParams: { deny: identifyingNames },
};

export default sentryHttpDataCollection;
