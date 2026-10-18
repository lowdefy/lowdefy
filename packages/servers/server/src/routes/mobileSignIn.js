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

import { handleMobileSignIn } from '@lowdefy/api';

import authJson from '../../lib/build/auth.js';
import getAuth from '../../lib/server/auth/getAuth.js';
import lowdefyConfig from '../../lib/build/config.js';

// GET /auth/mobile - the sign-in page a phone shell opens in a system sheet;
// handleMobileSignIn sends the person through the app's sign-in page and back
// to the shell's scheme with a one-time token bound to the shell's PKCE code
// challenge (code_challenge, code_challenge_method=S256, required).
function mobileSignInHandler(c) {
  const { logger } = c.get('lowdefyContext');
  return handleMobileSignIn({
    auth: authJson.configured === true ? getAuth({ logger }) : null,
    authJson,
    basePath: lowdefyConfig.basePath ?? '',
    request: c.req.raw,
  });
}

export default mobileSignInHandler;
