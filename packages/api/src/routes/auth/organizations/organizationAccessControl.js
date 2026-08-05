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

import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access';

// The actions the step floor asks for that BetterAuth's organization statements
// do not carry. Registered on the ORGANIZATION plugin's access control, not the
// admin plugin's: the floor asks the control that can express per-organization
// authority. The resource names are the admin design's, kept verbatim so its
// catalog table stays the contract.
const ADDED = {
  member: ['list'],
  user: ['ban', 'delete', 'set-attributes', 'update'],
  session: ['revoke'],
};

const statements = {
  ...defaultStatements,
  member: [...defaultStatements.member, ...ADDED.member],
  user: [...ADDED.user],
  session: [...ADDED.session],
};

const ac = createAccessControl(statements);

function grant(vendored) {
  return {
    ...vendored.statements,
    member: [...(vendored.statements.member ?? []), ...ADDED.member],
    user: [...ADDED.user],
    session: [...ADDED.session],
  };
}

// owner and admin currently differ only by organization: ["delete"], and member
// holds none of the added actions - so most of the map's distinctions are latent
// today. They go live the moment a narrower role is registered, with nothing to
// redesign: the statement set already names every action the floor asks about.
const roles = {
  owner: ac.newRole(grant(ownerAc)),
  admin: ac.newRole(grant(adminAc)),
  // member keeps the vendored statements verbatim, including ac: ["read"], which
  // is inert - dynamicAccessControl is off and the AC endpoints are unmounted.
  member: ac.newRole({ ...memberAc.statements }),
};

export { ac, roles, statements };
export default { ac, roles, statements };
