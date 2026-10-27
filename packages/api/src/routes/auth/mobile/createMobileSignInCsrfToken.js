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

import { createHmac } from 'node:crypto';

// The CSRF token on the mobile sign-in confirmation page: an HMAC, under the
// auth secret, of the browser session the page was shown to and the sign-in
// it confirms (shell, state, code challenge, platform). The POST that mints
// the one-time token must carry it, so it only comes from that page, shown to
// that session, for that sign-in.
function createMobileSignInCsrfToken({ params, secret, sessionId }) {
  const { codeChallenge, platform, shell, state } = params;
  return createHmac('sha256', secret)
    .update(
      ['lowdefy-mobile-sign-in', sessionId, shell.id, state, codeChallenge, platform].join('\n')
    )
    .digest('base64url');
}

export default createMobileSignInCsrfToken;
