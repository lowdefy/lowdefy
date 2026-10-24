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

import getMobileSessionExpiry from './getMobileSessionExpiry.js';
import isNativeAuthRequest from './isNativeAuthRequest.js';

// session.create.before, bound when mobile.auth.sessionExpiresIn is set. A
// session created by a phone signing in natively (the email-code screen) is
// marked mobile and given the phone lifetime. A session created in the sign-in
// sheet is the sheet browser's and stays one: the phone gets a new session of
// its own once the person confirms, marked when it is created
// (createPhoneSession).
function createMobileSessionCreateHook({ sessionExpiresIn }) {
  return async function mobileSessionCreate(session, ctx) {
    if (!isNativeAuthRequest({ request: ctx?.request })) {
      return undefined;
    }
    return {
      data: {
        ...session,
        mobile: true,
        expiresAt: getMobileSessionExpiry({ sessionExpiresIn }),
      },
    };
  };
}

export default createMobileSessionCreateHook;
