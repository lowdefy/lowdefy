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

// The caller the browser runner injects when a journey names none, and the base an inline user
// object merges over (the dev server's resolveHeadlessUser), so a journey acts as the same
// caller with or without a browser.
const HEADLESS_USER = { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] };

// Who a headless run opens a journey as: a data set user's name or "none" as given, an inline
// user object over the default caller, and the default caller when the journey names none.
function readHeadlessUser({ user }) {
  if (type.isNone(user)) {
    return HEADLESS_USER;
  }
  if (type.isObject(user)) {
    return { ...HEADLESS_USER, ...user };
  }
  return user;
}

export default readHeadlessUser;
