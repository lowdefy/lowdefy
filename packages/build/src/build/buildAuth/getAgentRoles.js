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

function getAgentRoles({ components }) {
  const roles = components.auth.agents.roles;
  const agentIds = (components.agents ?? []).map((a) => a.id);
  const agentRoles = {};
  Object.keys(roles).forEach((roleName) => {
    roles[roleName].forEach((pattern) => {
      agentIds.forEach((agentId) => {
        if (matchesPattern(agentId, pattern)) {
          if (!agentRoles[agentId]) {
            agentRoles[agentId] = new Set();
          }
          agentRoles[agentId].add(roleName);
        }
      });
    });
  });
  Object.keys(agentRoles).forEach((agentId) => {
    agentRoles[agentId] = [...agentRoles[agentId]];
  });
  return agentRoles;
}

export default getAgentRoles;
