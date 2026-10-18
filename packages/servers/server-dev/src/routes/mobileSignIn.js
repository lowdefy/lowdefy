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
import { type } from '@lowdefy/helpers';

import authJson from '../../lib/build/auth.js';
import getAuth from '../../lib/server/auth/getAuth.js';
import getMockUser from '../../lib/server/auth/getMockUser.js';
import lowdefyConfig from '../../lib/build/config.js';
import themeConfig from '../../lib/build/theme.js';

// The auth engine is off while dev.mockUser is set and for journeys on a data
// set, as on /api/auth/* (routes/auth.js).
function getEngine(c) {
  if (authJson.configured !== true || getMockUser()) {
    return null;
  }
  if (!type.isNone(c.get('lowdefyContext')?.dataSet)) {
    return null;
  }
  return getAuth({ logger: c.get('lowdefyContext').logger });
}

// GET and POST /auth/mobile - the sign-in page a phone shell opens in a system
// sheet. handleMobileSignIn sends the person through the app's sign-in page,
// asks them to confirm (GET), and on Continue (POST) returns a one-time token
// for a new phone session, bound to the shell's PKCE code challenge, to the
// shell's scheme (iOS) or app link (Android). The page takes the app theme's
// primary colour. An app without a mobile section has no such page, so the
// path falls through to the app's own pages.
function mobileSignInHandler(c, next) {
  if (type.isNone(authJson.mobile)) {
    return next();
  }
  return handleMobileSignIn({
    auth: getEngine(c),
    authJson,
    basePath: lowdefyConfig.basePath ?? '',
    primaryColor: themeConfig.antd?.token?.colorPrimary,
    request: c.req.raw,
  });
}

export default mobileSignInHandler;
