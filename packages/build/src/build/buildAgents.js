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
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function buildAgents({ components, context }) {
  if (type.isNone(components.agents)) {
    return components;
  }

  context.agentIds = new Set();

  const checkDuplicateAgentId = createCheckDuplicateId({
    message: 'Duplicate agentId "{{ id }}".',
  });

  (components.agents ?? []).forEach((agent) => {
    const configKey = agent['~k'];

    // Check duplicates
    checkDuplicateAgentId({ id: agent.id, configKey });

    // Track type usage for buildTypes validation
    context.typeCounters.agents.increment(agent.type, configKey);

    // Validate connectionId is provided
    if (type.isNone(agent.connectionId)) {
      throw new ConfigError(`Agent connectionId is not defined at "${agent.id}".`, {
        configKey,
      });
    }

    // Validate connectionId references an existing connection
    // Connections may have been renamed by buildConnections:
    //   connection.connectionId = original id, connection.id = 'connection:' + original id
    const connectionExists = (components.connections ?? []).some(
      (c) => c.id === agent.connectionId || c.connectionId === agent.connectionId
    );
    if (!connectionExists) {
      throw new ConfigError(
        `Agent "${agent.id}" references connectionId "${agent.connectionId}" which does not exist.`,
        { configKey }
      );
    }

    // Validate tools reference existing API endpoints
    (agent.tools ?? []).forEach((toolEndpointId) => {
      const endpointExists = (components.api ?? []).some(
        (e) => e.id === toolEndpointId || e.endpointId === toolEndpointId
      );
      if (!endpointExists) {
        throw new ConfigError(
          `Agent "${agent.id}" references tool endpoint "${toolEndpointId}" which does not exist.`,
          { configKey }
        );
      }
    });

    // Rename id to internal format
    agent.agentId = agent.id;
    context.agentIds.add(agent.agentId);
    agent.id = `agent:${agent.agentId}`;

    // Count server operators in properties
    countOperators(agent.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildAgents;
