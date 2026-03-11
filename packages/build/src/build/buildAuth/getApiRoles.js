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

import { matchesPattern } from './matchPattern.js';

function getApiRoles({ components }) {
  const roles = components.auth.api.roles;
  const endpointIds = (components.api ?? []).map((e) => e.id);
  const apiRoles = {};
  Object.keys(roles).forEach((roleName) => {
    roles[roleName].forEach((pattern) => {
      endpointIds.forEach((endpointId) => {
        if (matchesPattern(endpointId, pattern)) {
          if (!apiRoles[endpointId]) {
            apiRoles[endpointId] = new Set();
          }
          apiRoles[endpointId].add(roleName);
        }
      });
    });
  });
  Object.keys(apiRoles).forEach((endpointId) => {
    apiRoles[endpointId] = [...apiRoles[endpointId]];
  });
  return apiRoles;
}

export default getApiRoles;
