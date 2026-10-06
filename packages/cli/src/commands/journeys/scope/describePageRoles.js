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

import admitsRoles from './admitsRoles.js';
import normaliseArtifact from './normaliseArtifact.js';

function describeAccess(auth) {
  if (auth.public === true) return 'public';
  if (type.isArray(auth.roles)) return 'roles';
  return 'signed-in';
}

// Who can open a page, from the head build's page auth: access is public,
// signed-in (any signed-in user) or roles (a user holding one of roles), and
// users are the data set users the page admits, so a journey on the page can
// name one of them.
function describePageRoles({ page, users }) {
  const auth = normaliseArtifact(page).auth;
  const access = describeAccess(auth);
  return {
    access,
    roles: access === 'roles' ? [...auth.roles].map(String).sort() : [],
    users: users.filter((user) => admitsRoles({ auth, roles: user.roles })),
  };
}

export default describePageRoles;
