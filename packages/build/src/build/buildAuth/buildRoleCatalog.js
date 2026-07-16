/* eslint-disable no-param-reassign */

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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// Collects every role name declared in config into auth.roles - the catalog
// the runtime registers in the organization plugin's access control so its
// member APIs accept custom roles for assignment. Registration carries empty
// permission statements; real statements are the permissions milestone's.
function buildRoleCatalog({ components }) {
  const roleNames = new Set();

  function addRoleName({ configKey, roleName }) {
    // member.role stores multiple roles as one comma-separated string, so a
    // comma inside a role name would corrupt the split back into an array.
    if (roleName.includes(',')) {
      throw new ConfigError(
        `Auth role name "${roleName}" contains a comma. Roles are stored as a comma-separated list on the membership record, so role names cannot contain commas.`,
        { configKey }
      );
    }
    roleNames.add(roleName);
  }

  ['pages', 'api', 'agents', 'websockets'].forEach((entity) => {
    const rolesMap = components.auth[entity].roles;
    Object.keys(rolesMap).forEach((roleName) => {
      addRoleName({ configKey: rolesMap['~k'] ?? components.auth['~k'], roleName });
    });
  });

  // The configured user-admin role must be a grantable member role even when
  // no entity roles map names it - UpdateMemberRoles grants through the org
  // plugin's member APIs, which reject roles missing from its access control.
  if (!type.isNone(components.auth.userAdminRole)) {
    addRoleName({
      configKey: components.auth['~k'],
      roleName: components.auth.userAdminRole,
    });
  }

  components.auth.roles = [...roleNames].sort();

  return components;
}

export default buildRoleCatalog;
