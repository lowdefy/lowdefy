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

import { ConfigError } from '@lowdefy/errors';
import { translate } from '@lowdefy/helpers';

async function getAgentConfig({ i18n, logger, readConfigFile }, { agentId }) {
  const agent = await readConfigFile(`agents/${agentId}.json`);
  if (!agent) {
    const err = new ConfigError(
      translate({ key: 'agent.runtime.agentNotFound', values: { agentId }, i18n })
    );
    logger.debug({ params: { agentId }, err }, err.message);
    throw err;
  }
  return agent;
}

export default getAgentConfig;
