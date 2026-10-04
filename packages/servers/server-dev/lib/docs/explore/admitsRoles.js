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

// Whether a built page's auth admits a signed-in caller with these roles:
// public pages admit everyone, a page with roles admits a caller holding one
// of them, and a protected page without roles admits any signed-in caller.
function admitsRoles({ auth, roles = [] }) {
  if (type.isNone(auth) || auth.public === true) return true;
  if (type.isArray(auth.roles)) {
    return auth.roles.some((role) => roles.includes(role));
  }
  return true;
}

export default admitsRoles;
