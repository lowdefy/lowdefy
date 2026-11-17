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

const NO_ROLE_USER = 'no-role';

// A data set user can not be named "none" (it means signed out) or start with "_" (it reads as an
// operator), and "no-role" is the scaffold's own user, so a role with one of those names, or with
// a name another role's user already took, gets a "role-" prefix.
function userName({ role, taken }) {
  let name = role;
  while (name === 'none' || name.startsWith('_') || taken.has(name)) {
    name = `role-${name}`;
  }
  return name;
}

// The users of the first roles data set: one per declared role, named after it and holding only
// it, and "no-role", a signed-in user with no roles, which shows what any signed-in user reaches.
// Keys are sorted, as the access table's callers are.
function createRoleUsers({ roles }) {
  const taken = new Set([NO_ROLE_USER]);
  const users = { [NO_ROLE_USER]: { id: NO_ROLE_USER, roles: [] } };
  roles.forEach((role) => {
    const name = userName({ role, taken });
    taken.add(name);
    users[name] = { id: name, roles: [role] };
  });
  return Object.fromEntries(
    Object.keys(users)
      .sort()
      .map((name) => [name, users[name]])
  );
}

export default createRoleUsers;
