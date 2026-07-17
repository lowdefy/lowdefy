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

import normalizeRoleCatalog from './normalizeRoleCatalog.js';

// The authored auth.roles catalog is the single source of truth for an app's
// roles. This validates the catalog and every gate reference against it,
// policy-aware, then normalizes the catalog to { id, label, description }
// entries the runtime registers in the organization plugin's access control.
function buildRoleCatalog({ components }) {
  const authoredRoles = components.auth.roles ?? [];
  const policy = components.auth.organizations?.policy ?? 'pinned';

  const authoredIds = new Set();
  authoredRoles.forEach((role) => {
    const configKey = role['~k'] ?? components.auth['~k'];
    // member.role stores multiple roles as one comma-separated string, so a
    // comma inside a role id would corrupt the split back into an array.
    if (role.id.includes(',')) {
      throw new ConfigError(
        `Auth role name "${role.id}" contains a comma. Roles are stored as a comma-separated list on the membership record, so role names cannot contain commas.`,
        { configKey }
      );
    }
    // The "$" namespace is reserved for engine-internal roles such as
    // "$lowdefy-system"; authored ids may not claim it.
    if (role.id.startsWith('$')) {
      throw new ConfigError(
        `Auth role id "${role.id}" is reserved — role ids may not begin with "$".`,
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

  // Under tenant policy the built-in organization tier is always registered,
  // so its names are implicitly declared gate references.
  const validGateIds = new Set(authoredIds);
  if (policy === 'tenant') {
    ['owner', 'admin', 'member'].forEach((builtIn) => validGateIds.add(builtIn));
  }

  ['pages', 'api', 'agents', 'websockets'].forEach((entity) => {
    const rolesMap = components.auth[entity]?.roles ?? {};
    Object.keys(rolesMap).forEach((roleName) => {
      if (!validGateIds.has(roleName)) {
        throw new ConfigError(
          `Auth gate references role "${roleName}", which is not declared in auth.roles.`,
          { configKey: rolesMap['~k'] ?? components.auth['~k'] }
        );
      }
    });
  });

  // userAdminRole is pinned-only (validateAuthConfig rejects it under tenant),
  // so it must resolve through the authored catalog, not the built-in tier.
  const { userAdminRole } = components.auth;
  if (!type.isNone(userAdminRole) && !authoredIds.has(userAdminRole)) {
    throw new ConfigError(
      `Auth "userAdminRole" is "${userAdminRole}", which is not declared in auth.roles.`,
      { configKey: components.auth['~k'] }
    );
  }

  components.auth.roles = normalizeRoleCatalog(authoredRoles);

  return components;
}

export default buildRoleCatalog;
