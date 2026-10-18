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

import { handleMobileSignInCallback } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import authJson from '../../lib/build/auth.js';
import themeConfig from '../../lib/build/theme.js';

// GET /auth/mobile/callback - the Android app link the sign-in sheet returns
// to. Android opens it in the shell; this page shows only when the link is not
// verified, and asks the person to return to the app. An app without a mobile
// section has no such page, so the path falls through to the app's own pages.
function mobileSignInCallbackHandler(c, next) {
  if (type.isNone(authJson.mobile)) {
    return next();
  }
  return handleMobileSignInCallback({ primaryColor: themeConfig.antd?.token?.colorPrimary });
}

export default mobileSignInCallbackHandler;
