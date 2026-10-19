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

import { type } from '@lowdefy/helpers';

import claimCallerReload from './claimCallerReload.js';

// True when an auth refusal means the page shows a caller the server no longer
// admits, so it must reload and let the server render the page again. A 401
// while a user is rendered means the session ended; with no user it is an
// ordinary refusal on a public page and is thrown, so it cannot loop. A
// request's 403 reloads too: page requests share their page's auth, so the
// caller lost the page. An endpoint's 403 does not, since endpoints carry their
// own roles and a refusal is an ordinary outcome there. A two-factor enrolment
// refusal never reloads. Matched by name: plugins bundle their own
// @lowdefy/errors copy.
function shouldReloadForAuthError({ error, reloadOnAuthorizationError, user, window }) {
  if (error.name === 'AuthenticationError' && !type.isNone(user)) {
    return claimCallerReload({ window });
  }
  if (error.name === 'AuthorizationError' && reloadOnAuthorizationError === true) {
    return claimCallerReload({ window });
  }
  return false;
}

export default shouldReloadForAuthError;
