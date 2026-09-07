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

import { isReserved, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import getAgentRoles from './getAgentRoles.js';
import getProtectedAgents from './getProtectedAgents.js';
import { isInPatternList } from './matchPattern.js';

// Agents are served from the API surface, so auth.api patterns match agent ids too.
function buildAgentAuth({ components, context }) {
  // buildAuth runs before buildAgents, so this is the first step to read an
  // agent id - and both helpers below key plain objects on it. A reserved id
  // resolves through Object.prototype: `agentRoles.__proto__` is truthy for
  // every app, so the agent is stamped with Object.prototype as its roles and
  // the whole build writes through the global prototype from there. Gate before
  // either helper runs - buildAgents' own gate never gets the chance.
  (components.agents ?? []).forEach((agent) => {
    if (isReserved(agent.id)) {
      throw new ConfigError(
        `Agent id "${agent.id}" is a reserved name and cannot be used as an id.`,
        { configKey: agent['~k'] }
      );
    }
  });
  const protectedAgents = getProtectedAgents({ components });
  const agentRoles = getAgentRoles({ components });
  let configPublicApi = [];
  if (type.isArray(components.auth.api.public)) {
    configPublicApi = components.auth.api.public;
  }

  (components.agents ?? []).forEach((agent) => {
    if (agentRoles[agent.id]) {
      if (isInPatternList(agent.id, configPublicApi)) {
        throw new ConfigError(`Agent "${agent.id}" is both protected by roles and public.`, {
          received: agentRoles[agent.id],
          configKey: agent['~k'],
        });
      }
      agent.auth = {
        public: false,
        roles: agentRoles[agent.id],
      };
    } else if (protectedAgents.includes(agent.id)) {
      agent.auth = {
        public: false,
      };
    } else {
      agent.auth = {
        public: true,
      };
    }
  });

  return components;
}

export default buildAgentAuth;
