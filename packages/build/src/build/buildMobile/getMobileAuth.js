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

// mobile.auth with every default written, so the shell and the server read
// each key without fallbacks. sessionExpiresIn stays null when unset: phone
// sessions then live as long as auth.session.expiresIn says.
function getMobileAuth({ mobile }) {
  const auth = mobile.auth ?? {};
  return {
    emailCode: auth.emailCode ?? true,
    unlock: auth.unlock ?? 'none',
    unlockAfter: auth.unlockAfter ?? 300,
    sharedDevice: auth.sharedDevice ?? false,
    sessionExpiresIn: type.isNone(auth.sessionExpiresIn) ? null : auth.sessionExpiresIn,
  };
}

export default getMobileAuth;
