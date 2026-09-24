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

import getAuthKeys from './getAuthKeys.js';

// auth.dev names callers for the dev server's own tooling. It configures no
// login method, no session store and no adapter, so an auth block whose only
// substance is dev is not an auth configuration: the app runs signed out in
// production, and in dev the browser is treated as auth.dev.mockUser.
const devOnlyKeys = ['dev'];

// configured = the app declares a runtime auth stack. Intent, not
// completeness, is the gate: validation runs on any such block and errors on
// missing pieces, instead of silently skipping incomplete auth config.
function isAuthConfigured({ components }) {
  return getAuthKeys({ components }).some((key) => !devOnlyKeys.includes(key));
}

export default isAuthConfigured;
