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

import { AuthenticationError } from '@lowdefy/errors';
import { parseCallerStamp } from '@lowdefy/helpers';

import claimCallerReload from './claimCallerReload.js';
import hasOtherRoles from './hasOtherRoles.js';
import isOtherCaller from './isOtherCaller.js';

// True when the page must reload because the server answered as another caller
// than the page renders - another person signed in, or the organization was
// switched, in another tab - or answered the same caller with other roles, so
// the page never shows two callers' data or access the person no longer holds.
// serverCaller is the response's x-lowdefy-caller header. A changed session or
// membership list with the same person, organization and roles does not reload.
// A second difference within the reload interval throws instead of reloading
// again (see claimCallerReload).
function shouldReloadForCaller({ serverCaller, user, window }) {
  const stamp = parseCallerStamp(serverCaller);
  const otherCaller = isOtherCaller({ stamp, user });
  if (!otherCaller && !hasOtherRoles({ stamp, user })) {
    return false;
  }
  if (claimCallerReload({ window })) {
    return true;
  }
  if (otherCaller) {
    throw new AuthenticationError(
      'The server answered as a different user or organization than this page shows. Reload the page.'
    );
  }
  throw new AuthenticationError(
    'The server answered with different roles than this page shows. Reload the page.'
  );
}

export default shouldReloadForCaller;
