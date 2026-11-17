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

// Every role the build declares: the auth.roles ids and the roles the page and endpoint gates
// name, sorted by code unit so the roles data set is the same on every machine. The build writes
// roles, pages.roles and api.roles on every auth.json, auth configured or not.
function listDeclaredRoles({ authJson }) {
  const roles = new Set();
  authJson.roles.forEach((role) => roles.add(role.id));
  Object.keys(authJson.pages.roles).forEach((role) => roles.add(role));
  Object.keys(authJson.api.roles).forEach((role) => roles.add(role));
  return [...roles].sort();
}

export default listDeclaredRoles;
