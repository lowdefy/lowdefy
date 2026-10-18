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

import getAuthSettings from './getAuthSettings.js';

/**
 * What the app shows for its auth state and session state:
 * - `lock`: the lock screen, before any page;
 * - `loading`: the token is being read;
 * - `signIn`: the app has auth and nobody is signed in;
 * - `app`: the app's pages (or the session's own loading and error screens).
 */
function getAuthView({ auth, session }) {
  if (auth.status === 'locked') {
    return 'lock';
  }
  if (auth.status === 'starting') {
    return 'loading';
  }
  if (session.status === 'ready' && getAuthSettings(session.root) !== null && !auth.hasToken) {
    return 'signIn';
  }
  return 'app';
}

export default getAuthView;
