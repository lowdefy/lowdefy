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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import getAgentRoles from './getAgentRoles.js';
import getProtectedAgents from './getProtectedAgents.js';
import { isInPatternList } from './matchPattern.js';

function buildAgentAuth({ components, context }) {
  const protectedAgents = getProtectedAgents({ components });
  const agentRoles = getAgentRoles({ components });
  let configPublicAgents = [];
  if (type.isArray(components.auth.agents.public)) {
    configPublicAgents = components.auth.agents.public;
  }

  (components.agents || []).forEach((agent) => {
    if (agentRoles[agent.id]) {
      if (isInPatternList(agent.id, configPublicAgents)) {
        throw new ConfigError(
          `Agent "${agent.id}" is both protected by roles and public.`,
          {
            received: agentRoles[agent.id],
            configKey: agent['~k'],
          }
        );
      }
      agent.externalApi = {
        enabled: true,
        auth: {
          public: false,
          roles: agentRoles[agent.id],
        },
      };
    } else if (protectedAgents.includes(agent.id)) {
      agent.externalApi = {
        enabled: true,
        auth: {
          public: false,
        },
      };
    } else if (isInPatternList(agent.id, configPublicAgents)) {
      agent.externalApi = {
        enabled: true,
        auth: {
          public: true,
        },
      };
    } else {
      agent.externalApi = {
        enabled: false,
      };
    }
  });

  return components;
}

export default buildAgentAuth;
