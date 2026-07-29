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

import { AuthenticationError, ConfigError } from '@lowdefy/errors';
import { translate, type } from '@lowdefy/helpers';

function authorizeAgent({ authorize, i18n, logger, user }, { agentConfig }) {
  if (!authorize(agentConfig)) {
    logger.debug({
      event: 'debug_agent_authorize',
      authorized: false,
      auth_config: agentConfig.auth,
    });
    // Unauthenticated on a protected agent - 401 tells the caller to fix its
    // credentials. Wrong roles stay opaque below, using the same wording as
    // the missing-agent error so existence is not leaked.
    if (type.isNone(user)) {
      throw new AuthenticationError(
        translate({
          key: 'agent.runtime.authenticationRequired',
          values: { agentId: agentConfig.agentId },
          i18n,
        })
      );
    }
    throw new ConfigError(
      translate({
        key: 'agent.runtime.agentNotFound',
        values: { agentId: agentConfig.agentId },
        i18n,
      })
    );
  }
  logger.debug({
    event: 'debug_agent_authorize',
    authorized: true,
    auth_config: agentConfig.auth,
  });
}

export default authorizeAgent;
