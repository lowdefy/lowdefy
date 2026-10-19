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

import { rolesHash, type } from '@lowdefy/helpers';

// True when the server answered the rendered caller with other roles than the
// page renders - a role was granted or taken away since the page loaded - so
// _user.roles and role-gated blocks would show access the person no longer
// holds, or hide access they now have. stamp is the response's parsed
// x-lowdefy-caller header, user the rendered caller. A stamp that names no
// roles (no header, or an anonymous caller) claims none.
function hasOtherRoles({ stamp, user }) {
  if (type.isNone(user) || type.isNone(stamp?.roles)) {
    return false;
  }
  return stamp.roles !== rolesHash({ user });
}

export default hasOtherRoles;
