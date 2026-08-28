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

import { ConfigError, TwoFactorEnrolmentRequiredError } from '@lowdefy/errors';
import { translate } from '@lowdefy/helpers';

function authorizeAgent({ authorizeOutcome, i18n, logger }, { agentConfig }) {
  const outcome = authorizeOutcome(agentConfig);
  if (outcome !== 'allow') {
    logger.debug({
      event: 'debug_agent_authorize',
      authorized: false,
      outcome,
      auth_config: agentConfig.auth,
    });
    if (outcome === 'enrol_required') {
      // Reached only after the role check passed, so the caller is authorised and
      // this reveals nothing about which agents exist.
      throw new TwoFactorEnrolmentRequiredError(
        `Two-factor enrolment required for agent "${agentConfig.agentId}".`
      );
    }
    // Same message as an unknown agentId so responses do not reveal which agents exist.
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
