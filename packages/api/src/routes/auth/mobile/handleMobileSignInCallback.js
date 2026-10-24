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

import createMobileAuthPageResponse from './createMobileAuthPageResponse.js';

// GET /auth/mobile/callback - the Android app link the sign-in sheet returns
// to (getMobileSignInReturnUrl). Android opens it in the shell when the link
// is verified (assetlinks.json), so this page shows only when it is not: it
// asks the person to go back to the app. It never shows the query, and its
// script takes the one-time token out of the address bar and history.
function handleMobileSignInCallback({ primaryColor }) {
  return createMobileAuthPageResponse({
    title: 'Return to the app',
    primaryColor,
    script: 'history.replaceState(null, "", location.pathname);',
    content: `<h1>Return to the app</h1>
<p>Go back to the app to finish signing in.</p>`,
  });
}

export default handleMobileSignInCallback;
