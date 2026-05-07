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

function buildChannels({ components, context }) {
  if (type.isNone(components.channels)) {
    return components;
  }

  const agentIds = new Set((components.agents ?? []).map((a) => a.agentId ?? a.id));

  for (const [platform, channelConfig] of Object.entries(components.channels)) {
    if (type.isNone(channelConfig) || !type.isObject(channelConfig)) continue;

    if (!agentIds.has(channelConfig.agentId)) {
      throw new ConfigError(
        `Channel "${platform}" references non-existent agent "${channelConfig.agentId}".`,
        { configKey: components.channels['~k'] }
      );
    }
  }

  return components;
}

export default buildChannels;
