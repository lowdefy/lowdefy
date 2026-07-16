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

/* eslint-disable no-param-reassign */

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

const markerKeys = ['~ignoreBuildChecks', '~r', '~l', '~k'];

// Validates the channels block and writes its defaults. Runs after buildAuth
// and buildAgents - each channel's agent reference is checked against
// context.agentIds, and its service identity roles are cross-checked against
// the agent's stamped auth artifact so a dead-on-arrival channel (whose
// caller could never pass authorizeAgent) fails the build, not runtime.
function buildChannels({ components, context }) {
  if (type.isNone(components.channels)) {
    components.channels = {};
  }
  const channels = components.channels;
  const platforms = Object.keys(channels).filter((key) => !markerKeys.includes(key));
  channels.configured = platforms.length > 0;

  platforms.forEach((platform) => {
    const channel = channels[platform];
    const configKey = channel['~k'] ?? channels['~k'] ?? components['~k'];

    channel.roles = channel.roles ?? [];
    channel.attributes = channel.attributes ?? {};

    if (!context.agentIds.has(channel.agentId)) {
      throw new ConfigError(
        `Channel "${platform}" references agent "${channel.agentId}" which does not exist.`,
        { configKey }
      );
    }

    const agent = (components.agents ?? []).find((a) => a.agentId === channel.agentId);
    if (agent.auth.public === false) {
      const agentRoles = agent.auth.roles;
      const holdsRole =
        type.isNone(agentRoles) || agentRoles.some((role) => channel.roles.includes(role));
      if (!holdsRole) {
        throw new ConfigError(
          `Channel "${platform}" cannot call agent "${channel.agentId}" - the agent requires one of roles ${JSON.stringify(agentRoles)} but the channel's roles are ${JSON.stringify(channel.roles)}. Grant the channel a qualifying role or make the agent public.`,
          { configKey }
        );
      }
    }
  });

  return components;
}

export default buildChannels;
