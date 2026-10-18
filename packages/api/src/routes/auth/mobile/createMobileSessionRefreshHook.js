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

// session.update.before, bound when mobile.auth.sessionExpiresIn is set.
// BetterAuth slides a session forward by auth.session.expiresIn when it is
// read (getSession), and hands this hook only the changed fields. getSession
// has put the session it is refreshing on the endpoint context first, so a
// refresh of a phone session is told by its mobile mark and slid forward by
// the phone lifetime instead. Every other update passes through unchanged.
function createMobileSessionRefreshHook({ sessionExpiresIn }) {
  return async function mobileSessionRefresh(changes, ctx) {
    if (changes.expiresAt === undefined) {
      return undefined;
    }
    if (ctx?.context?.session?.session?.mobile !== true) {
      return undefined;
    }
    return {
      data: {
        ...changes,
        expiresAt: getMobileSessionExpiry({ sessionExpiresIn }),
      },
    };
  };
}

export default createMobileSessionRefreshHook;
