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
import { isReserved } from '@lowdefy/helpers';

import normalizeRoleCatalog from './normalizeRoleCatalog.js';

// The authored auth.roles catalog is the single source of truth for an app's
// roles. This validates the catalog and every gate reference against it, then
// normalizes the catalog to { id, label, description } entries the runtime
// registers in the organization plugin's access control.
//
// The built-in organization tier (owner/admin/member) is not a valid gate
// reference under either policy: it reaches apps as _user.org_roles, while
// createAuthorizeOutcome.js matches gates against user.roles alone, which is
// member.appRoles. A gate on a tier name would never match any caller.
function buildRoleCatalog({ components }) {
  const authoredRoles = components.auth.roles ?? [];

  const authoredIds = new Set();
  authoredRoles.forEach((role) => {
    const configKey = role['~k'] ?? components.auth['~k'];
    // The role id keys the organization plugin's access-control role catalog,
    // a plain object.
    if (isReserved(role.id)) {
      throw new ConfigError(
        `Auth role id "${role.id}" is a reserved name and cannot be used as a role id.`,
        { configKey }
      );
    }
    if (authoredIds.has(role.id)) {
      throw new ConfigError(`Auth role id "${role.id}" is declared more than once.`, {
        configKey,
      });
    }
    authoredIds.add(role.id);
  });

  ['pages', 'api', 'websockets'].forEach((entity) => {
    const rolesMap = components.auth[entity]?.roles ?? {};
    Object.keys(rolesMap).forEach((roleName) => {
      if (!authoredIds.has(roleName)) {
        throw new ConfigError(
          `Auth gate references role "${roleName}", which is not declared in auth.roles. Gate on an app role declared in auth.roles; the organization tier (owner/admin/member) is not a gate source - it reaches apps as _user.org_roles.`,
          { configKey: rolesMap['~k'] ?? components.auth['~k'] }
        );
      }
    });
  });

  components.auth.roles = normalizeRoleCatalog(authoredRoles);

  return components;
}

export default buildRoleCatalog;
