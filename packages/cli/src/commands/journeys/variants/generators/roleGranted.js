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

import journeyUser from '../journeyUser.js';
import roleKey from '../roleKey.js';

function formatRoles(roles) {
  return `[${roles.join(', ')}]`;
}

// The data set user names the journey runs as, or null when it runs as an
// inline user, signed out or as no data set user, so has no list to add to.
function listedUserNames({ journey, dataSet }) {
  if (type.isArray(journey.user)) {
    return journey.user;
  }
  const { name } = journeyUser({ journey, dataSet });
  return type.isNull(name) ? null : [name];
}

// The role sets the journey already runs as: each listed user's, or its one
// user's.
function currentRoleKeys({ journey, dataSet, names }) {
  if (type.isNull(names)) {
    return new Set([roleKey(journeyUser({ journey, dataSet }).user?.roles)]);
  }
  return new Set(
    names
      .filter((name) => Object.prototype.hasOwnProperty.call(dataSet.users, name))
      .map((name) => roleKey(dataSet.users[name].roles))
  );
}

// Role, granted: for each role set other than the journey users' (the page's
// role matrix from production use, else each data set user's role set), the
// same steps as a data set user with exactly that set. A set no user has is
// listed for the developer to add. When the start page has auth.roles, a set
// holding none of them is left to the refused variant. A variant that passes
// is kept as a persona of the journey, not a copy: its comment names the user
// list to set on the original journey, and the variant file is then deleted.
function roleGranted({ journey, dataSet, roleMatrix, pageConfigs }) {
  if (type.isNone(dataSet)) {
    return { skipped: 'the journey declares no data: set' };
  }
  const names = listedUserNames({ journey, dataSet });
  const current = currentRoleKeys({ journey, dataSet, names });
  const pageRoles = pageConfigs[0]?.auth?.roles;
  const source = type.isNone(roleMatrix)
    ? Object.values(dataSet.users).map((user) => user.roles)
    : roleMatrix;
  const roleSets = new Map();
  source.forEach((roles) => {
    const key = roleKey(roles);
    const set = JSON.parse(key);
    if (current.has(key)) return;
    if (type.isArray(pageRoles) && !set.some((role) => pageRoles.includes(role))) return;
    roleSets.set(key, set);
  });
  if (roleSets.size === 0) {
    return {
      skipped: `no role set other than the journey user's ${
        type.isNone(roleMatrix) ? 'among the data set users' : "in the page's role matrix"
      }`,
    };
  }
  const userNames = Object.keys(dataSet.users).sort();
  const variants = [];
  const skipped = [];
  [...roleSets.keys()].sort().forEach((key) => {
    const roles = roleSets.get(key);
    const name = userNames.find((userName) => roleKey(dataSet.users[userName].roles) === key);
    if (type.isUndefined(name)) {
      skipped.push(`add a user with roles ${formatRoles(roles)} to the data set`);
      return;
    }
    const variant = {
      kind: 'role',
      detail: `granted to ${name} ${formatRoles(roles)}`,
      overrides: { user: name },
      steps: journey.steps,
    };
    if (!type.isNull(names)) {
      variant.comments = {
        0: `Passes? Keep ${name} as a persona of "${journey.name}", not a copy: set its user to [${[
          ...names,
          name,
        ].join(', ')}] and delete this file.`,
      };
    }
    variants.push(variant);
  });
  return { variants, skipped };
}

export default roleGranted;
