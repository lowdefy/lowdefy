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

import getMobileAuth from '../buildMobile/getMobileAuth.js';

// The facts the auth server needs about phones, written onto auth.json only
// when the app has a mobile section: it turns on bearer sessions and the
// mobile sign-in page, which hands a one-time token only to a listed shell's
// scheme, and sets how long phone sessions last.
function buildAuthMobile({ components }) {
  if (type.isNone(components.mobile)) {
    return components;
  }
  components.auth.mobile = {
    shells: (components.mobile.shells ?? [])
      .filter((shell) => type.isString(shell.scheme))
      .map((shell) => ({ id: shell.id, scheme: shell.scheme })),
    sessionExpiresIn: getMobileAuth({ mobile: components.mobile }).sessionExpiresIn,
  };
  return components;
}

export default buildAuthMobile;
